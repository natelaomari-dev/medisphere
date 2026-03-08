import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pill, Plus, Package, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const MED_CATEGORIES = ["Analgesic", "Antibiotic", "Antihypertensive", "Antidiabetic", "Antihistamine", "Vitamin", "Other"];
const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler"];

function useMedications() {
  return useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medications").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
}

function usePrescriptions() {
  return useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*, patients(first_name, last_name, patient_id), doctors(full_name), medications(name, strength, dosage_form)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useAddMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: any) => {
      const { data, error } = await supabase.from("medications").insert(med).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
  });
}

function useDispensePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dispensed_by }: { id: string; dispensed_by: string }) => {
      const { error } = await supabase.from("prescriptions").update({
        status: "dispensed" as any,
        dispensed_by,
        dispensed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
}

const RX_STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
  dispensed: { label: "Dispensed", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  partially_dispensed: { label: "Partial", cls: "bg-sky-500/10 text-sky-600 border-sky-500/20", icon: <Package className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function Pharmacy() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const { data: medications, isLoading: medsLoading } = useMedications();
  const { data: prescriptions, isLoading: rxLoading } = usePrescriptions();
  const addMed = useAddMedication();
  const dispense = useDispensePrescription();

  const [tab, setTab] = useState("inventory");
  const [search, setSearch] = useState("");
  const [medDialog, setMedDialog] = useState(false);
  const [form, setForm] = useState({ name: "", generic_name: "", category: "Analgesic", dosage_form: "Tablet", strength: "", unit_price: "", stock_quantity: "", reorder_level: "10", manufacturer: "" });

  const lowStock = (medications ?? []).filter((m) => m.stock_quantity <= m.reorder_level);
  const pendingRx = (prescriptions ?? []).filter((p) => p.status === "pending").length;

  const filteredMeds = (medications ?? []).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || (m.generic_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredRx = (prescriptions ?? []).filter((p) => {
    const patient = p.patients as any;
    const med = p.medications as any;
    const term = search.toLowerCase();
    return (patient?.first_name ?? "").toLowerCase().includes(term) ||
      (patient?.last_name ?? "").toLowerCase().includes(term) ||
      (med?.name ?? "").toLowerCase().includes(term);
  });

  const handleAddMed = async () => {
    if (!form.name) return;
    try {
      await addMed.mutateAsync({
        name: form.name,
        generic_name: form.generic_name || null,
        category: form.category,
        dosage_form: form.dosage_form.toLowerCase(),
        strength: form.strength || null,
        unit_price: form.unit_price ? Number(form.unit_price) : 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        reorder_level: Number(form.reorder_level) || 10,
        manufacturer: form.manufacturer || null,
        hospital_id: hospitalId || null,
      });
      toast.success("Medication added");
      setMedDialog(false);
      setForm({ name: "", generic_name: "", category: "Analgesic", dosage_form: "Tablet", strength: "", unit_price: "", stock_quantity: "", reorder_level: "10", manufacturer: "" });
    } catch {
      toast.error("Failed to add medication");
    }
  };

  const handleDispense = async (id: string) => {
    if (!user) return;
    try {
      await dispense.mutateAsync({ id, dispensed_by: user.id });
      toast.success("Prescription dispensed");
    } catch {
      toast.error("Failed to dispense");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy</h1>
          <p className="text-sm text-muted-foreground">
            {medications?.length ?? 0} medications · {pendingRx} pending prescriptions
          </p>
        </div>
        <Dialog open={medDialog} onOpenChange={setMedDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Add Medication</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Brand Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Generic Name</Label><Input value={form.generic_name} onChange={(e) => setForm((p) => ({ ...p, generic_name: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MED_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Dosage Form</Label>
                  <Select value={form.dosage_form} onValueChange={(v) => setForm((p) => ({ ...p, dosage_form: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOSAGE_FORMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Strength</Label><Input value={form.strength} onChange={(e) => setForm((p) => ({ ...p, strength: e.target.value }))} placeholder="500mg" /></div>
                <div className="space-y-1"><Label>Unit Price</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Stock Qty</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Reorder Level</Label><Input type="number" value={form.reorder_level} onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} /></div>
              </div>
              <Button onClick={handleAddMed} disabled={addMed.isPending || !form.name} className="w-full mt-2">
                {addMed.isPending ? "Adding..." : "Add Medication"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Pill className="h-4 w-4 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{medications?.length ?? 0}</p><p className="text-xs text-muted-foreground">Medications</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div><div><p className="text-2xl font-bold text-destructive">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-600" /></div><div><p className="text-2xl font-bold text-foreground">{pendingRx}</p><p className="text-xs text-muted-foreground">Pending Rx</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div><div><p className="text-2xl font-bold text-foreground">{(prescriptions ?? []).filter((p) => p.status === "dispensed").length}</p><p className="text-xs text-muted-foreground">Dispensed</p></div></CardContent></Card>
      </div>

      {/* Search + Tabs */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search medications or patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Medication Inventory</CardTitle></CardHeader>
            <CardContent className="p-0">
              {medsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : !filteredMeds.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No medications found. Add one to get started.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Form</TableHead><TableHead>Strength</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredMeds.map((m) => {
                      const isLow = m.stock_quantity <= m.reorder_level;
                      return (
                        <TableRow key={m.id}>
                          <TableCell><div><span className="font-medium text-sm">{m.name}</span>{m.generic_name && <p className="text-xs text-muted-foreground">{m.generic_name}</p>}</div></TableCell>
                          <TableCell><Badge variant="outline" className="bg-muted/50">{m.category}</Badge></TableCell>
                          <TableCell className="text-sm capitalize">{m.dosage_form}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.strength || "—"}</TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${isLow ? "text-destructive" : "text-foreground"}`}>
                              {m.stock_quantity}
                            </span>
                            {isLow && <AlertTriangle className="h-3 w-3 text-destructive inline ml-1" />}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">₦{Number(m.unit_price).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4" /> Prescriptions</CardTitle></CardHeader>
            <CardContent className="p-0">
              {rxLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : !filteredRx.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No prescriptions found.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Patient</TableHead><TableHead>Medication</TableHead><TableHead>Dosage</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Doctor</TableHead><TableHead className="w-[100px]">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredRx.map((rx) => {
                      const patient = rx.patients as any;
                      const med = rx.medications as any;
                      const doctor = rx.doctors as any;
                      const st = RX_STATUS[rx.status] || RX_STATUS.pending;
                      return (
                        <TableRow key={rx.id}>
                          <TableCell><div className="text-sm font-medium">{patient?.first_name} {patient?.last_name}</div><div className="text-xs text-muted-foreground">{patient?.patient_id}</div></TableCell>
                          <TableCell><span className="text-sm font-medium">{med?.name}</span>{med?.strength && <span className="text-xs text-muted-foreground ml-1">{med.strength}</span>}</TableCell>
                          <TableCell className="text-sm">{rx.dosage} · {rx.frequency}</TableCell>
                          <TableCell className="text-sm">{rx.quantity}</TableCell>
                          <TableCell><Badge variant="outline" className={st.cls}><span className="flex items-center gap-1">{st.icon} {st.label}</span></Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{doctor?.full_name ?? "—"}</TableCell>
                          <TableCell>
                            {rx.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDispense(rx.id)} disabled={dispense.isPending}>
                                Dispense
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
