import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { usePatients } from "@/hooks/useHospitalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FlaskConical, Plus, Clock, CheckCircle2, Loader2, TestTubes } from "lucide-react";
import { toast } from "sonner";

const TEST_CATEGORIES = ["Hematology", "Biochemistry", "Microbiology", "Urinalysis", "Radiology", "Pathology"];
const COMMON_TESTS: Record<string, string[]> = {
  Hematology: ["Complete Blood Count", "Blood Smear", "ESR", "Coagulation Profile"],
  Biochemistry: ["Liver Function Test", "Renal Function Test", "Lipid Profile", "Blood Glucose"],
  Microbiology: ["Blood Culture", "Urine Culture", "Sensitivity Test", "Gram Stain"],
  Urinalysis: ["Routine Urinalysis", "Urine Microscopy", "Pregnancy Test"],
  Radiology: ["Chest X-Ray", "Abdominal Ultrasound", "CT Scan", "MRI"],
  Pathology: ["Biopsy", "Cytology", "Histopathology"],
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
  sample_collected: { label: "Collected", className: "bg-sky-500/10 text-sky-600 border-sky-500/20", icon: <TestTubes className="h-3 w-3" /> },
  processing: { label: "Processing", className: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20", icon: <Clock className="h-3 w-3" /> },
};

function useLabOrders() {
  return useQuery({
    queryKey: ["lab_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select("*, patients(first_name, last_name, patient_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      patient_id: string;
      test_name: string;
      test_category: string;
      priority: string;
      notes?: string;
      ordered_by: string;
      hospital_id?: string;
    }) => {
      const { data, error } = await supabase.from("lab_orders").insert(order).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_orders"] }),
  });
}

function useUpdateLabOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, result_value, result_unit, result_notes, completed_by }: {
      id: string; status: string; result_value?: string; result_unit?: string; result_notes?: string; completed_by?: string;
    }) => {
      const updates: any = { status };
      if (result_value) updates.result_value = result_value;
      if (result_unit) updates.result_unit = result_unit;
      if (result_notes) updates.result_notes = result_notes;
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = completed_by;
      }
      const { error } = await supabase.from("lab_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_orders"] }),
  });
}

export default function Laboratory() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const { data: orders, isLoading } = useLabOrders();
  const { data: patients } = usePatients();
  const createOrder = useCreateLabOrder();
  const updateStatus = useUpdateLabOrderStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(TEST_CATEGORIES[0]);
  const [selectedTest, setSelectedTest] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [priority, setPriority] = useState("routine");
  const [notes, setNotes] = useState("");

  const filtered = (orders ?? []).filter((o) => {
    const patient = o.patients as any;
    const name = `${patient?.first_name ?? ""} ${patient?.last_name ?? ""}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || o.test_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = (orders ?? []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = async () => {
    if (!selectedPatient || !selectedTest || !user) return;
    try {
      await createOrder.mutateAsync({
        patient_id: selectedPatient,
        test_name: selectedTest,
        test_category: selectedCategory,
        priority,
        notes: notes || undefined,
        ordered_by: user.id,
        hospital_id: hospitalId || undefined,
      });
      toast.success("Lab order created");
      setDialogOpen(false);
      setSelectedTest("");
      setSelectedPatient("");
      setNotes("");
    } catch {
      toast.error("Failed to create lab order");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus, completed_by: user?.id });
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratory</h1>
          <p className="text-sm text-muted-foreground">
            {orders?.length ?? 0} total orders · {statusCounts["processing"] || 0} processing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> New Lab Order</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Lab Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {(patients ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.patient_id} — {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedTest(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEST_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Test</Label>
                  <Select value={selectedTest} onValueChange={setSelectedTest}>
                    <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      {(COMMON_TESTS[selectedCategory] ?? []).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Clinical notes..." />
              </div>
              <Button onClick={handleCreate} disabled={createOrder.isPending || !selectedPatient || !selectedTest} className="w-full mt-2">
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Card key={key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                {cfg.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts[key] || 0}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient or test..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Lab Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading lab orders...</div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {(orders ?? []).length === 0 ? "No lab orders yet. Create one to get started." : "No orders match your filters."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead className="w-[140px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const patient = o.patients as any;
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  const priorityCls = o.priority === "stat"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : o.priority === "urgent"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-muted/50 text-muted-foreground";
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{patient?.first_name} {patient?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{patient?.patient_id}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{o.test_name}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-muted/50">{o.test_category}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={priorityCls}>{o.priority.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.result_value ? `${o.result_value}${o.result_unit ? ` ${o.result_unit}` : ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {o.status !== "completed" && o.status !== "cancelled" && (
                          <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sample_collected">Collected</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
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
    </div>
  );
}
