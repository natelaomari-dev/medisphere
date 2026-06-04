import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { usePatients } from "@/hooks/useHospitalData";
import { useLabPanels, useLabSpecimens, useAddSpecimen, useLabResults, useAddLabResult, useVerifyResult } from "@/hooks/useLabAdvanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Plus, Beaker, TestTubes, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const sb = supabase as any;

function useLabOrders() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["lab_orders", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("lab_orders").select("*, patients(first_name,last_name,patient_id)").eq("hospital_id", hospitalId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

const FLAG_COLOR: Record<string, string> = {
  normal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  low: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  abnormal: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  critical_low: "bg-destructive/10 text-destructive border-destructive/40",
  critical_high: "bg-destructive/10 text-destructive border-destructive/40",
};

export default function Laboratory() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [] } = useLabOrders();
  const { data: patients = [] } = usePatients();
  const { data: panels = [] } = useLabPanels();

  const [tab, setTab] = useState("orders");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<any>({ patient_id: "", panel_id: "", custom_test: "", priority: "routine", notes: "" });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleCreateOrder = async () => {
    if (!orderForm.patient_id) return toast.error("Select a patient");
    const panel = panels.find((p: any) => p.id === orderForm.panel_id);
    const tests = panel ? panel.included_tests : (orderForm.custom_test ? [orderForm.custom_test] : []);
    if (!tests.length) return toast.error("Select a panel or enter a test");
    try {
      for (const t of tests) {
        await sb.from("lab_orders").insert({
          hospital_id: hospitalId, patient_id: orderForm.patient_id, ordered_by: user!.id,
          test_name: t, test_category: panel?.panel_code || "general", priority: orderForm.priority, notes: orderForm.notes || null,
        });
      }
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
      toast.success(`${tests.length} order(s) created`);
      setNewOrderOpen(false);
      setOrderForm({ patient_id: "", panel_id: "", custom_test: "", priority: "routine", notes: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  const critical = orders.filter((o: any) => o.status === "completed").length; // placeholder

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laboratory</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orders · {panels.length} panels available</p>
        </div>
        <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Order</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New lab order</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Patient</Label>
                <Select value={orderForm.patient_id} onValueChange={(v) => setOrderForm({ ...orderForm, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.patient_id} — {p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Panel (bundled tests)</Label>
                <Select value={orderForm.panel_id} onValueChange={(v) => setOrderForm({ ...orderForm, panel_id: v, custom_test: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select panel" /></SelectTrigger>
                  <SelectContent>{panels.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.panel_name} ({p.included_tests.length})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="text-xs text-center text-muted-foreground">— or —</div>
              <div><Label>Single test name</Label><Input value={orderForm.custom_test} onChange={(e) => setOrderForm({ ...orderForm, custom_test: e.target.value, panel_id: "" })} /></div>
              <div><Label>Priority</Label>
                <Select value={orderForm.priority} onValueChange={(v) => setOrderForm({ ...orderForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleCreateOrder}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="panels">Panels</TabsTrigger></TabsList>

        <TabsContent value="orders">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Test</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Ordered</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell><div className="font-medium text-sm">{o.patients?.first_name} {o.patients?.last_name}</div></TableCell>
                    <TableCell className="text-sm">{o.test_name}</TableCell>
                    <TableCell><Badge variant="outline" className={o.priority === "stat" ? "bg-destructive/10 text-destructive" : o.priority === "urgent" ? "bg-amber-500/10 text-amber-600" : ""}>{o.priority.toUpperCase()}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelectedOrder(o)}>Open</Button></TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="panels">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {panels.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> {p.panel_name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">{p.panel_code}</p>
                  <ul className="text-xs space-y-1">{p.included_tests.map((t: string) => <li key={t}>• {t}</li>)}</ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedOrder && <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const { data: specimens = [] } = useLabSpecimens(order.id);
  const { data: results = [] } = useLabResults(order.id);
  const addSpec = useAddSpecimen();
  const addResult = useAddLabResult();
  const verify = useVerifyResult();

  const [specForm, setSpecForm] = useState<any>({ specimen_type: "blood", container: "EDTA", volume_ml: "" });
  const [resForm, setResForm] = useState<any>({ test_name: order.test_name, result_value: "", result_numeric: "", result_unit: "", reference_range_low: "", reference_range_high: "", method: "", instrument: "" });

  const handleSpec = async () => {
    try {
      await addSpec.mutateAsync({ lab_order_id: order.id, ...specForm, volume_ml: specForm.volume_ml ? Number(specForm.volume_ml) : null });
      toast.success("Specimen logged");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleResult = async () => {
    if (!resForm.result_value) return toast.error("Result value required");
    try {
      await addResult.mutateAsync({
        lab_order_id: order.id, patient_id: order.patient_id, test_name: resForm.test_name,
        result_value: resForm.result_value,
        result_numeric: resForm.result_numeric ? Number(resForm.result_numeric) : null,
        result_unit: resForm.result_unit || null,
        reference_range_low: resForm.reference_range_low ? Number(resForm.reference_range_low) : null,
        reference_range_high: resForm.reference_range_high ? Number(resForm.reference_range_high) : null,
        method: resForm.method || null, instrument: resForm.instrument || null,
        result_status: "preliminary",
      });
      toast.success("Result recorded");
      setResForm({ ...resForm, result_value: "", result_numeric: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{order.test_name} — {order.patients?.first_name} {order.patients?.last_name}</DialogTitle></DialogHeader>
        <Tabs defaultValue="specimens">
          <TabsList><TabsTrigger value="specimens">Specimens</TabsTrigger><TabsTrigger value="results">Results</TabsTrigger></TabsList>
          <TabsContent value="specimens" className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Select value={specForm.specimen_type} onValueChange={(v) => setSpecForm({ ...specForm, specimen_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["blood","serum","plasma","urine","stool","sputum","csf","swab","tissue"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Container" value={specForm.container} onChange={(e) => setSpecForm({ ...specForm, container: e.target.value })} />
              <Input type="number" placeholder="Vol (ml)" value={specForm.volume_ml} onChange={(e) => setSpecForm({ ...specForm, volume_ml: e.target.value })} />
            </div>
            <Button size="sm" onClick={handleSpec}><TestTubes className="h-3 w-3 mr-2" /> Log specimen</Button>
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Container</TableHead><TableHead>Vol</TableHead><TableHead>Collected</TableHead><TableHead>Condition</TableHead></TableRow></TableHeader>
              <TableBody>{specimens.map((s: any) => <TableRow key={s.id}><TableCell>{s.specimen_type}</TableCell><TableCell>{s.container}</TableCell><TableCell>{s.volume_ml}</TableCell><TableCell className="text-xs">{new Date(s.collection_datetime).toLocaleString()}</TableCell><TableCell><Badge variant="outline">{s.condition}</Badge></TableCell></TableRow>)}</TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="results" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Test name" value={resForm.test_name} onChange={(e) => setResForm({ ...resForm, test_name: e.target.value })} />
              <Input placeholder="Result value" value={resForm.result_value} onChange={(e) => setResForm({ ...resForm, result_value: e.target.value })} />
              <Input placeholder="Numeric (for flagging)" type="number" value={resForm.result_numeric} onChange={(e) => setResForm({ ...resForm, result_numeric: e.target.value })} />
              <Input placeholder="Unit" value={resForm.result_unit} onChange={(e) => setResForm({ ...resForm, result_unit: e.target.value })} />
              <Input placeholder="Ref low" type="number" value={resForm.reference_range_low} onChange={(e) => setResForm({ ...resForm, reference_range_low: e.target.value })} />
              <Input placeholder="Ref high" type="number" value={resForm.reference_range_high} onChange={(e) => setResForm({ ...resForm, reference_range_high: e.target.value })} />
              <Input placeholder="Method" value={resForm.method} onChange={(e) => setResForm({ ...resForm, method: e.target.value })} />
              <Input placeholder="Instrument" value={resForm.instrument} onChange={(e) => setResForm({ ...resForm, instrument: e.target.value })} />
            </div>
            <Button size="sm" onClick={handleResult}>Record result</Button>
            <Table>
              <TableHeader><TableRow><TableHead>Test</TableHead><TableHead>Value</TableHead><TableHead>Range</TableHead><TableHead>Flag</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{results.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.test_name}</TableCell>
                  <TableCell className="font-mono text-sm">{r.result_value} {r.result_unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.reference_range_low ?? "–"} – {r.reference_range_high ?? "–"}</TableCell>
                  <TableCell>{r.flag && <Badge variant="outline" className={FLAG_COLOR[r.flag]}>{r.flag.includes("critical") && <AlertCircle className="h-3 w-3 mr-1" />}{r.flag.replace("_", " ")}</Badge>}</TableCell>
                  <TableCell><Badge variant="outline">{r.result_status}</Badge></TableCell>
                  <TableCell>{r.result_status === "preliminary" && <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: r.id })}><CheckCircle2 className="h-3 w-3 mr-1" /> Verify</Button>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
