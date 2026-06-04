import { useState } from "react";
import { useOtRooms, useAddOtRoom, useSurgeries, useScheduleSurgery, useUpdateSurgery, useUpdateChecklist } from "@/hooks/useOT";
import { usePatients, useDoctors } from "@/hooks/useHospitalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Scissors, Plus, ShieldCheck, Clock, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SIGN_IN_ITEMS = [
  "Patient identity, site, procedure & consent confirmed",
  "Site marked",
  "Anaesthesia safety check completed",
  "Pulse oximeter on patient & functioning",
  "Known allergies?",
  "Difficult airway/aspiration risk?",
  "Risk of >500ml blood loss (7ml/kg in children)?",
];
const TIME_OUT_ITEMS = [
  "All team members introduced (name & role)",
  "Patient name, procedure & site confirmed verbally",
  "Antibiotic prophylaxis given within 60 minutes",
  "Anticipated critical events reviewed by surgeon",
  "Anaesthetist concerns reviewed",
  "Nursing team: sterility, equipment issues reviewed",
  "Imaging displayed",
];
const SIGN_OUT_ITEMS = [
  "Procedure recorded",
  "Instrument, sponge, needle counts correct",
  "Specimen labelled (incl. patient name)",
  "Equipment problems to address",
  "Key concerns for recovery & management reviewed",
];

export default function OperatingTheatre() {
  const { data: rooms = [] } = useOtRooms();
  const { data: surgeries = [] } = useSurgeries();
  const { data: patients = [] } = usePatients();
  const { data: doctors = [] } = useDoctors();
  const addRoom = useAddOtRoom();
  const schedule = useScheduleSurgery();
  const updateSurgery = useUpdateSurgery();
  const updateChecklist = useUpdateChecklist();

  const [roomOpen, setRoomOpen] = useState(false);
  const [rForm, setRForm] = useState({ room_number: "", room_type: "general" });
  const [schedOpen, setSchedOpen] = useState(false);
  const [sForm, setSForm] = useState<any>({ patient_id: "", procedure_name: "", procedure_code: "", surgeon_id: "", anaesthetist_id: "", ot_room_id: "", scheduled_start: "", scheduled_end: "", pre_op_notes: "", anaesthesia_type: "general" });
  const [activeSurgery, setActiveSurgery] = useState<any>(null);

  const today = surgeries.filter((s: any) => new Date(s.scheduled_start).toDateString() === new Date().toDateString());
  const inProgress = surgeries.filter((s: any) => s.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Operating Theatre</h1>
          <p className="text-sm text-muted-foreground">{rooms.length} rooms · {today.length} cases today · {inProgress.length} in progress</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Room</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add OT room</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Room number</Label><Input value={rForm.room_number} onChange={(e) => setRForm({ ...rForm, room_number: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={rForm.room_type} onValueChange={(v) => setRForm({ ...rForm, room_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["general","orthopaedic","cardiac","obstetric","emergency","minor","endoscopy"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={async () => { await addRoom.mutateAsync(rForm); toast.success("Room added"); setRoomOpen(false); setRForm({ room_number: "", room_type: "general" }); }}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Schedule Surgery</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Schedule surgery</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Patient</Label>
                  <Select value={sForm.patient_id} onValueChange={(v) => setSForm({ ...sForm, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.patient_id} — {p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Procedure</Label><Input value={sForm.procedure_name} onChange={(e) => setSForm({ ...sForm, procedure_name: e.target.value })} /></div>
                  <div><Label>Code (CPT/ICD)</Label><Input value={sForm.procedure_code} onChange={(e) => setSForm({ ...sForm, procedure_code: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Surgeon</Label>
                    <Select value={sForm.surgeon_id} onValueChange={(v) => setSForm({ ...sForm, surgeon_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Anaesthetist</Label>
                    <Select value={sForm.anaesthetist_id} onValueChange={(v) => setSForm({ ...sForm, anaesthetist_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Room</Label>
                  <Select value={sForm.ot_room_id} onValueChange={(v) => setSForm({ ...sForm, ot_room_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{rooms.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.room_number} ({r.room_type})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Start</Label><Input type="datetime-local" value={sForm.scheduled_start} onChange={(e) => setSForm({ ...sForm, scheduled_start: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="datetime-local" value={sForm.scheduled_end} onChange={(e) => setSForm({ ...sForm, scheduled_end: e.target.value })} /></div>
                </div>
                <div><Label>Anaesthesia</Label>
                  <Select value={sForm.anaesthesia_type} onValueChange={(v) => setSForm({ ...sForm, anaesthesia_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["general","spinal","epidural","regional","local","sedation"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Pre-op notes</Label><Textarea rows={2} value={sForm.pre_op_notes} onChange={(e) => setSForm({ ...sForm, pre_op_notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={async () => {
                if (!sForm.patient_id || !sForm.procedure_name || !sForm.scheduled_start) return toast.error("Patient, procedure, start required");
                try {
                  await schedule.mutateAsync({ ...sForm, scheduled_start: new Date(sForm.scheduled_start).toISOString(), scheduled_end: sForm.scheduled_end ? new Date(sForm.scheduled_end).toISOString() : null });
                  toast.success("Scheduled");
                  setSchedOpen(false);
                } catch (e: any) { toast.error(e.message); }
              }}>Schedule</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Procedure</TableHead><TableHead>Surgeon</TableHead><TableHead>Room</TableHead><TableHead>Start</TableHead><TableHead>Status</TableHead><TableHead>Safety</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {surgeries.map((s: any) => {
              const cl = s.surgical_safety_checklist?.[0];
              const phases = [cl?.sign_in_completed, cl?.time_out_completed, cl?.sign_out_completed].filter(Boolean).length;
              return (
                <TableRow key={s.id}>
                  <TableCell><div className="text-sm font-medium">{s.patients?.first_name} {s.patients?.last_name}</div></TableCell>
                  <TableCell className="text-sm">{s.procedure_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.surgeon?.full_name}</TableCell>
                  <TableCell className="text-sm">{s.ot_rooms?.room_number || "—"}</TableCell>
                  <TableCell className="text-sm">{format(new Date(s.scheduled_start), "MMM d HH:mm")}</TableCell>
                  <TableCell><Badge variant="outline" className={s.status === "in_progress" ? "bg-amber-500/10 text-amber-600" : s.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : ""}>{s.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={phases === 3 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}><ShieldCheck className="h-3 w-3 mr-1" />{phases}/3</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setActiveSurgery(s)}>Open</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {surgeries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No surgeries scheduled</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      {activeSurgery && <SurgeryDetailDialog surgery={activeSurgery} onClose={() => setActiveSurgery(null)} onUpdate={updateSurgery} onChecklist={updateChecklist} />}
    </div>
  );
}

function SurgeryDetailDialog({ surgery, onClose, onUpdate, onChecklist }: any) {
  const cl = surgery.surgical_safety_checklist?.[0] || {};
  const [intraNotes, setIntraNotes] = useState(surgery.intra_op_notes || "");
  const [postNotes, setPostNotes] = useState(surgery.post_op_notes || "");
  const [bloodLoss, setBloodLoss] = useState(surgery.blood_loss_ml || "");
  const [complications, setComplications] = useState(surgery.complications || "");

  const handlePhase = async (phase: "sign_in" | "time_out" | "sign_out", items: string[]) => {
    const data: any = {};
    items.forEach((i, idx) => { data[`item_${idx}`] = (document.getElementById(`${phase}_${idx}`) as HTMLInputElement)?.checked; });
    await onChecklist.mutateAsync({ surgery_id: surgery.id, phase, data });
    toast.success(`${phase.replace("_", " ")} signed`);
  };

  const updateStatus = async (status: string) => {
    const patch: any = { status, intra_op_notes: intraNotes, post_op_notes: postNotes, blood_loss_ml: bloodLoss ? Number(bloodLoss) : null, complications };
    if (status === "in_progress") patch.actual_start = new Date().toISOString();
    if (status === "completed") patch.actual_end = new Date().toISOString();
    await onUpdate.mutateAsync({ id: surgery.id, patch });
    toast.success("Updated");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle><Scissors className="h-4 w-4 inline mr-2" />{surgery.procedure_name}</DialogTitle></DialogHeader>
        <Tabs defaultValue="checklist">
          <TabsList><TabsTrigger value="checklist">WHO Safety Checklist</TabsTrigger><TabsTrigger value="op">Operative Record</TabsTrigger></TabsList>
          <TabsContent value="checklist" className="space-y-4">
            {[
              { key: "sign_in", title: "Sign In (before anaesthesia)", items: SIGN_IN_ITEMS, done: cl.sign_in_completed },
              { key: "time_out", title: "Time Out (before skin incision)", items: TIME_OUT_ITEMS, done: cl.time_out_completed },
              { key: "sign_out", title: "Sign Out (before leaving OR)", items: SIGN_OUT_ITEMS, done: cl.sign_out_completed },
            ].map((phase) => (
              <Card key={phase.key}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">{phase.title}</CardTitle>
                  {phase.done && <Badge className="bg-emerald-500/10 text-emerald-600">Completed</Badge>}
                </CardHeader>
                <CardContent className="space-y-2">
                  {phase.items.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2 text-sm">
                      <Checkbox id={`${phase.key}_${idx}`} defaultChecked={phase.done} disabled={phase.done} />
                      <span>{item}</span>
                    </label>
                  ))}
                  {!phase.done && <Button size="sm" onClick={() => handlePhase(phase.key as any, phase.items)}>Sign {phase.title.split(" ")[0]}</Button>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="op" className="space-y-3">
            <div><Label>Intra-operative notes</Label><Textarea rows={4} value={intraNotes} onChange={(e) => setIntraNotes(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Blood loss (ml)</Label><Input type="number" value={bloodLoss} onChange={(e) => setBloodLoss(e.target.value)} /></div>
              <div><Label>Complications</Label><Input value={complications} onChange={(e) => setComplications(e.target.value)} /></div>
            </div>
            <div><Label>Post-op notes</Label><Textarea rows={3} value={postNotes} onChange={(e) => setPostNotes(e.target.value)} /></div>
            <div className="flex gap-2">
              {surgery.status === "scheduled" && <Button onClick={() => updateStatus("in_progress")}><Play className="h-3 w-3 mr-1" /> Start</Button>}
              {surgery.status === "in_progress" && <Button onClick={() => updateStatus("completed")}><Square className="h-3 w-3 mr-1" /> Complete</Button>}
              <Button variant="outline" onClick={() => updateStatus(surgery.status)}>Save notes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
