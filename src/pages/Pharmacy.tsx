import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import {
  useMedicationStock, useMedicationBatches, useAddBatch, useDispense, useDrugSafetyCheck, useRecordOverride
} from "@/hooks/usePharmacyOps";
import { BarcodeLabel } from "@/components/BarcodeLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Plus, Package, AlertTriangle, CheckCircle2, Clock, Barcode, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { formatMoney } from "@/lib/locale";

const sb = supabase as any;

function useMedications() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["medications", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("medications").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

function usePrescriptions() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["prescriptions", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("prescriptions")
        .select("*, patients(first_name,last_name,patient_id), doctors(full_name), medications(name,strength,dosage_form,atc_code)")
        .eq("hospital_id", hospitalId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export default function Pharmacy() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: medications = [] } = useMedications();
  const { data: stock = [] } = useMedicationStock();
  const { data: batches = [] } = useMedicationBatches();
  const { data: prescriptions = [] } = usePrescriptions();
  const addBatch = useAddBatch();
  const dispense = useDispense();
  const safetyCheck = useDrugSafetyCheck();
  const recordOverride = useRecordOverride();

  const [tab, setTab] = useState("queue");
  const [batchDialog, setBatchDialog] = useState(false);
  const [bForm, setBForm] = useState<any>({ medication_id: "", batch_number: "", lot_number: "", expiry_date: "", manufacturing_date: "", quantity_received: "", unit_cost: "", supplier: "", supplier_invoice: "", storage_location: "" });
  const [showBarcode, setShowBarcode] = useState<any>(null);

  // dispense flow
  const [dispenseRx, setDispenseRx] = useState<any>(null);
  const [dispenseQty, setDispenseQty] = useState("");
  const [counseling, setCounseling] = useState("");
  const [warnings, setWarnings] = useState<any>(null);
  const [override, setOverride] = useState("");

  const stockMap = new Map(stock.map((s: any) => [s.medication_id, s]));
  const pending = prescriptions.filter((p: any) => p.status === "pending");
  const expiringBatches = batches.filter((b: any) => b.status === "available" && differenceInDays(new Date(b.expiry_date), new Date()) <= 90);
  const totalValue = batches.reduce((s: number, b: any) => s + (b.quantity_remaining * Number(b.unit_cost || 0)), 0);

  const handleAddBatch = async () => {
    if (!bForm.medication_id || !bForm.batch_number || !bForm.expiry_date || !bForm.quantity_received) {
      toast.error("Medication, batch, expiry, and quantity are required"); return;
    }
    try {
      await addBatch.mutateAsync({
        ...bForm,
        quantity_received: Number(bForm.quantity_received),
        unit_cost: bForm.unit_cost ? Number(bForm.unit_cost) : null,
        manufacturing_date: bForm.manufacturing_date || null,
      });
      toast.success("Batch added to inventory");
      setBatchDialog(false);
      setBForm({ medication_id: "", batch_number: "", lot_number: "", expiry_date: "", manufacturing_date: "", quantity_received: "", unit_cost: "", supplier: "", supplier_invoice: "", storage_location: "" });
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const openDispense = async (rx: any) => {
    setDispenseRx(rx);
    setDispenseQty(String(rx.quantity));
    setCounseling("");
    setOverride("");
    setWarnings(null);
    try {
      const result = await safetyCheck.mutateAsync({ patient_id: rx.patient_id, medication_id: rx.medication_id });
      if (result.interactions.length || result.allergyHits.length) setWarnings(result);
    } catch {}
  };

  const confirmDispense = async () => {
    if (!dispenseRx) return;
    if (warnings && !override.trim()) { toast.error("Please document override justification"); return; }
    try {
      if (warnings) {
        for (const i of warnings.interactions) {
          await recordOverride.mutateAsync({ prescription_id: dispenseRx.id, hospital_id: hospitalId, override_type: "interaction", warning_details: i, justification: override });
        }
        for (const a of warnings.allergyHits) {
          await recordOverride.mutateAsync({ prescription_id: dispenseRx.id, hospital_id: hospitalId, override_type: "allergy", warning_details: a, justification: override });
        }
      }
      const r = await dispense.mutateAsync({ prescription_id: dispenseRx.id, quantity: Number(dispenseQty), counseling });
      toast.success(`Dispensed ${r.dispensed} units across ${r.splits?.length || 0} batch(es)`);
      setDispenseRx(null);
    } catch (e: any) { toast.error(e.message || "Dispense failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy</h1>
          <p className="text-sm text-muted-foreground">{medications.length} medications · {pending.length} pending Rx · {batches.length} active batches</p>
        </div>
        <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Receive Batch</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Receive medication batch</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Medication</Label>
                <Select value={bForm.medication_id} onValueChange={(v) => setBForm({ ...bForm, medication_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select medication" /></SelectTrigger>
                  <SelectContent>{medications.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} {m.strength}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Batch number *</Label><Input value={bForm.batch_number} onChange={(e) => setBForm({ ...bForm, batch_number: e.target.value })} /></div>
                <div><Label>Lot number</Label><Input value={bForm.lot_number} onChange={(e) => setBForm({ ...bForm, lot_number: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Manufactured</Label><Input type="date" value={bForm.manufacturing_date} onChange={(e) => setBForm({ ...bForm, manufacturing_date: e.target.value })} /></div>
                <div><Label>Expiry *</Label><Input type="date" value={bForm.expiry_date} onChange={(e) => setBForm({ ...bForm, expiry_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity *</Label><Input type="number" value={bForm.quantity_received} onChange={(e) => setBForm({ ...bForm, quantity_received: e.target.value })} /></div>
                <div><Label>Unit cost</Label><Input type="number" step="0.01" value={bForm.unit_cost} onChange={(e) => setBForm({ ...bForm, unit_cost: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Supplier</Label><Input value={bForm.supplier} onChange={(e) => setBForm({ ...bForm, supplier: e.target.value })} /></div>
                <div><Label>Invoice #</Label><Input value={bForm.supplier_invoice} onChange={(e) => setBForm({ ...bForm, supplier_invoice: e.target.value })} /></div>
              </div>
              <div><Label>Storage location</Label><Input value={bForm.storage_location} onChange={(e) => setBForm({ ...bForm, storage_location: e.target.value })} placeholder="Shelf A3 / Cold storage" /></div>
            </div>
            <DialogFooter><Button onClick={handleAddBatch} disabled={addBatch.isPending}>Receive batch</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Pill className="h-4 w-4 text-primary" /><div><p className="text-2xl font-bold">{medications.length}</p><p className="text-xs text-muted-foreground">Medications</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Package className="h-4 w-4 text-primary" /><div><p className="text-2xl font-bold">{batches.length}</p><p className="text-xs text-muted-foreground">Active batches</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Clock className="h-4 w-4 text-amber-600" /><div><p className="text-2xl font-bold">{expiringBatches.length}</p><p className="text-xs text-muted-foreground">Expiring ≤90d</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="h-4 w-4 text-amber-600" /><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">Pending Rx</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><div><p className="text-2xl font-bold">{formatMoney(totalValue, "KE")}</p><p className="text-xs text-muted-foreground">Stock value</p></div></div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue">Dispensing Queue</TabsTrigger>
          <TabsTrigger value="batches">Batches (FEFO)</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card><CardHeader><CardTitle className="text-base">Pending prescriptions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Medication</TableHead><TableHead>Dose</TableHead><TableHead>Qty</TableHead><TableHead>Stock</TableHead><TableHead>Doctor</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {prescriptions.map((rx: any) => {
                    const s = stockMap.get(rx.medication_id) as any;
                    const available = s?.total_available || 0;
                    return (
                      <TableRow key={rx.id}>
                        <TableCell><div className="font-medium text-sm">{rx.patients?.first_name} {rx.patients?.last_name}</div><div className="text-xs text-muted-foreground">{rx.patients?.patient_id}</div></TableCell>
                        <TableCell className="text-sm">{rx.medications?.name} {rx.medications?.strength}</TableCell>
                        <TableCell className="text-sm">{rx.dosage} · {rx.frequency}</TableCell>
                        <TableCell className="text-sm">{rx.quantity}</TableCell>
                        <TableCell><span className={available < rx.quantity ? "text-destructive font-medium" : "text-emerald-600"}>{available}</span></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rx.doctors?.full_name || "—"}</TableCell>
                        <TableCell>
                          {rx.status === "pending" ? (
                            <Button size="sm" onClick={() => openDispense(rx)} disabled={available === 0}>Dispense</Button>
                          ) : <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{rx.status}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {prescriptions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No prescriptions</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Medication</TableHead><TableHead>Batch</TableHead><TableHead>Lot</TableHead><TableHead>Expiry</TableHead><TableHead>Remaining</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {batches.map((b: any) => {
                  const days = differenceInDays(new Date(b.expiry_date), new Date());
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm font-medium">{b.medications?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{b.batch_number}</TableCell>
                      <TableCell className="font-mono text-xs">{b.lot_number || "—"}</TableCell>
                      <TableCell>
                        <span className={days < 0 ? "text-destructive" : days < 90 ? "text-amber-600" : ""}>
                          {format(new Date(b.expiry_date), "MMM yyyy")} {days < 90 && days >= 0 ? `(${days}d)` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{b.quantity_remaining} / {b.quantity_received}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.storage_location || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={
                        b.status === "available" ? "bg-emerald-500/10 text-emerald-600" :
                        b.status === "expired" ? "bg-destructive/10 text-destructive" :
                        "bg-muted"
                      }>{b.status}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => setShowBarcode(b)}><Barcode className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
                {batches.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No batches yet. Receive your first batch.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Medication</TableHead><TableHead>Total available</TableHead><TableHead>Earliest expiry</TableHead><TableHead>Batches</TableHead></TableRow></TableHeader>
              <TableBody>
                {stock.map((s: any) => (
                  <TableRow key={s.medication_id}>
                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                    <TableCell><span className={s.total_available === 0 ? "text-destructive" : ""}>{s.total_available}</span></TableCell>
                    <TableCell className="text-sm">{s.earliest_expiry ? format(new Date(s.earliest_expiry), "MMM yyyy") : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.batch_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Dispense dialog */}
      <Dialog open={!!dispenseRx} onOpenChange={(o) => !o && setDispenseRx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dispense {dispenseRx?.medications?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm bg-muted/40 p-3 rounded">
              <p><strong>{dispenseRx?.patients?.first_name} {dispenseRx?.patients?.last_name}</strong></p>
              <p className="text-muted-foreground">{dispenseRx?.dosage} · {dispenseRx?.frequency} · {dispenseRx?.duration}</p>
            </div>
            {warnings && (warnings.interactions.length > 0 || warnings.allergyHits.length > 0) && (
              <div className="border border-destructive/40 bg-destructive/5 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm"><ShieldAlert className="h-4 w-4" /> Clinical safety warnings</div>
                {warnings.allergyHits.map((a: any, i: number) => (
                  <div key={`a${i}`} className="text-xs"><Badge variant="destructive" className="mr-1">ALLERGY</Badge> {a.substance} — {a.reaction || "documented allergy"} ({a.severity || "unknown"})</div>
                ))}
                {warnings.interactions.map((it: any, i: number) => (
                  <div key={`i${i}`} className="text-xs"><Badge variant="outline" className={
                    it.severity === "contraindicated" ? "bg-destructive/10 text-destructive border-destructive/40 mr-1" :
                    it.severity === "major" ? "bg-amber-500/10 text-amber-600 mr-1" : "mr-1"
                  }>{it.severity.toUpperCase()}</Badge> {it.drug_a_name} ↔ {it.drug_b_name}: {it.description}. <em>{it.management}</em></div>
                ))}
                <div>
                  <Label className="text-xs">Override justification (required)</Label>
                  <Textarea value={override} onChange={(e) => setOverride(e.target.value)} rows={2} placeholder="Clinical rationale for proceeding..." />
                </div>
              </div>
            )}
            <div><Label>Quantity to dispense</Label><Input type="number" value={dispenseQty} onChange={(e) => setDispenseQty(e.target.value)} /></div>
            <div><Label>Counseling notes</Label><Textarea value={counseling} onChange={(e) => setCounseling(e.target.value)} rows={2} placeholder="Patient counseling provided..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispenseRx(null)}>Cancel</Button>
            <Button onClick={confirmDispense} disabled={dispense.isPending}>Confirm dispense (FEFO)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode dialog */}
      <Dialog open={!!showBarcode} onOpenChange={(o) => !o && setShowBarcode(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Batch label</DialogTitle></DialogHeader>
          {showBarcode && <BarcodeLabel batch={showBarcode} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
