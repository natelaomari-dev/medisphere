import { useState, useMemo } from "react";
import { useServicePoints, useAddServicePoint, useQueue, useEnqueue, useUpdateQueueStatus } from "@/hooks/useQueue";
import { usePatients } from "@/hooks/useHospitalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Clock, Bell, Play } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

const SP_TYPES = ["registration", "triage", "consultation", "lab", "pharmacy", "cashier", "imaging"];

export default function QueueDashboard() {
  const { data: spoints = [] } = useServicePoints();
  const { data: queue = [] } = useQueue();
  const { data: patients = [] } = usePatients();
  const addSP = useAddServicePoint();
  const enqueue = useEnqueue();
  const update = useUpdateQueueStatus();

  const [spOpen, setSpOpen] = useState(false);
  const [spForm, setSpForm] = useState({ name: "", type: "consultation" });
  const [qOpen, setQOpen] = useState(false);
  const [qForm, setQForm] = useState<any>({ patient_id: "", service_point_id: "", priority: 0 });

  const byPoint = useMemo(() => {
    const m: Record<string, any[]> = {};
    queue.forEach((q: any) => {
      m[q.service_point_id] = m[q.service_point_id] || [];
      m[q.service_point_id].push(q);
    });
    return m;
  }, [queue]);

  const avgWait = (items: any[]) => {
    const served = items.filter((i) => i.served_at);
    if (!served.length) return 0;
    return Math.round(served.reduce((s, i) => s + differenceInMinutes(new Date(i.served_at), new Date(i.queued_at)), 0) / served.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue Management</h1>
          <p className="text-sm text-muted-foreground">Real-time waiting times across {spoints.length} service points</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={spOpen} onOpenChange={setSpOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add service point</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New service point</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <Input placeholder="Name (e.g. Consultation Room 1)" value={spForm.name} onChange={(e) => setSpForm({ ...spForm, name: e.target.value })} />
                <Select value={spForm.type} onValueChange={(v) => setSpForm({ ...spForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter><Button onClick={async () => { if (!spForm.name) return toast.error("Name required"); await addSP.mutateAsync(spForm); toast.success("Added"); setSpOpen(false); setSpForm({ name: "", type: "consultation" }); }}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={qOpen} onOpenChange={setQOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Enqueue patient</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add to queue</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <Select value={qForm.patient_id} onValueChange={(v) => setQForm({ ...qForm, patient_id: v })}><SelectTrigger><SelectValue placeholder="Patient" /></SelectTrigger><SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.patient_id} — {p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select>
                <Select value={qForm.service_point_id} onValueChange={(v) => setQForm({ ...qForm, service_point_id: v })}><SelectTrigger><SelectValue placeholder="Service point" /></SelectTrigger><SelectContent>{spoints.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>)}</SelectContent></Select>
                <div><Label>Priority</Label><Input type="number" value={qForm.priority} onChange={(e) => setQForm({ ...qForm, priority: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter><Button onClick={async () => {
                if (!qForm.patient_id || !qForm.service_point_id) return toast.error("Patient & point required");
                const ticket = await enqueue.mutateAsync(qForm);
                toast.success(`Ticket ${ticket}`);
                setQOpen(false);
              }}>Enqueue</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spoints.map((sp: any) => {
          const items = byPoint[sp.id] || [];
          const waiting = items.filter(i => i.status === "waiting");
          const inService = items.filter(i => i.status === "in_service" || i.status === "called");
          const wait = avgWait(items);
          const oldest = waiting[0];
          return (
            <Card key={sp.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{sp.name}</span>
                  <Badge variant="outline" className="text-xs">{sp.type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div><p className="text-2xl font-bold">{waiting.length}</p><p className="text-xs text-muted-foreground">Waiting</p></div>
                  <div><p className="text-2xl font-bold text-primary">{inService.length}</p><p className="text-xs text-muted-foreground">In service</p></div>
                  <div><p className="text-2xl font-bold">{wait}m</p><p className="text-xs text-muted-foreground">Avg wait</p></div>
                </div>
                {oldest && (
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Oldest: {formatDistanceToNow(new Date(oldest.queued_at))}
                  </div>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {items.slice(0, 8).map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
                      <div>
                        <span className="font-mono font-semibold">{q.ticket_number}</span>
                        <span className="ml-2">{q.patients?.first_name} {q.patients?.last_name}</span>
                        {q.priority > 0 && <Badge variant="destructive" className="ml-1 h-4 text-[10px]">P{q.priority}</Badge>}
                      </div>
                      <div className="flex gap-1">
                        {q.status === "waiting" && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => update.mutate({ id: q.id, status: "called" })}><Bell className="h-3 w-3" /></Button>}
                        {q.status === "called" && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => update.mutate({ id: q.id, status: "in_service" })}><Play className="h-3 w-3" /></Button>}
                        {q.status === "in_service" && <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => update.mutate({ id: q.id, status: "completed" })}>Done</Button>}
                        <Badge variant="outline" className="h-5 text-[10px]">{q.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Queue empty</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {spoints.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No service points configured yet. Add one to start managing queues.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
