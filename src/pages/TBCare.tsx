import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Users } from "lucide-react";
import { useHospital } from "@/hooks/useHospital";
import { usePatients } from "@/hooks/useHospitalData";
import { useTbCases, useAddTbCase, useTbDotVisits, useAddTbDot, useTbContacts, useAddTbContact } from "@/hooks/useClinicalModules";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const outcomeColors: Record<string, string> = {
  cured: "bg-success/10 text-success border-success/20",
  treatment_completed: "bg-success/10 text-success border-success/20",
  treatment_failed: "bg-critical/10 text-critical border-critical/20",
  died: "bg-critical/10 text-critical border-critical/20",
  lost_to_followup: "bg-warning/10 text-warning border-warning/20",
};

export default function TBCare() {
  const { data: cases } = useTbCases();
  const { data: patients } = usePatients();
  const { hospitalId } = useHospital();
  const add = useAddTbCase();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [f, setF] = useState<any>({
    registration_date: format(new Date(), "yyyy-MM-dd"),
    type: "new", disease_site: "pulmonary",
  });

  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, hospital_id: hospitalId });
      toast({ title: "TB case registered" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const selectedCase = cases?.find((c: any) => c.id === selectedId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">TB Care</h1>
          <p className="text-sm text-muted-foreground">TB case registry, DOT visits and contact tracing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Register TB case</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register TB Case</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Patient</Label>
                <Select value={f.patient_id || ""} onValueChange={v => setF({ ...f, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{patients?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Registration date</Label><Input type="date" value={f.registration_date} onChange={e => setF({ ...f, registration_date: e.target.value })} /></div>
              <div><Label>Registration #</Label><Input value={f.registration_number || ""} onChange={e => setF({ ...f, registration_number: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem><SelectItem value="relapse">Relapse</SelectItem>
                    <SelectItem value="treatment_after_failure">After failure</SelectItem><SelectItem value="treatment_after_loss">After loss</SelectItem>
                    <SelectItem value="transfer_in">Transfer in</SelectItem><SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Disease site</Label>
                <Select value={f.disease_site} onValueChange={v => setF({ ...f, disease_site: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pulmonary">Pulmonary</SelectItem><SelectItem value="extra_pulmonary">Extra-pulmonary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Bacteriological status</Label><Input value={f.bacteriological_status || ""} onChange={e => setF({ ...f, bacteriological_status: e.target.value })} placeholder="smear+/-, GeneXpert, etc." /></div>
              <div><Label>HIV status</Label><Input value={f.hiv_status || ""} onChange={e => setF({ ...f, hiv_status: e.target.value })} /></div>
              <div><Label>Regimen</Label><Input value={f.regimen || ""} onChange={e => setF({ ...f, regimen: e.target.value })} placeholder="2RHZE/4RH" /></div>
              <div><Label>Treatment start</Label><Input type="date" value={f.treatment_start_date || ""} onChange={e => setF({ ...f, treatment_start_date: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={!f.patient_id || add.isPending} className="w-full mt-3">Register</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>TB Cases ({cases?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Reg #</TableHead><TableHead>Patient</TableHead><TableHead>Type</TableHead><TableHead>Site</TableHead><TableHead>HIV</TableHead><TableHead>Started</TableHead><TableHead>Outcome</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {!cases?.length ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No TB cases</TableCell></TableRow> :
                cases.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.registration_number || "—"}</TableCell>
                    <TableCell>{c.patients?.first_name} {c.patients?.last_name}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.disease_site}</TableCell>
                    <TableCell>{c.hiv_status || "—"}</TableCell>
                    <TableCell>{c.treatment_start_date || "—"}</TableCell>
                    <TableCell>{c.outcome ? <Badge className={outcomeColors[c.outcome] || ""} variant="outline">{c.outcome.replace(/_/g, " ")}</Badge> : <Badge variant="outline">On treatment</Badge>}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>Open</Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCase && (
        <Card>
          <CardHeader><CardTitle>Case: {selectedCase.patients?.first_name} {selectedCase.patients?.last_name}</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="dot">
              <TabsList>
                <TabsTrigger value="dot"><Calendar className="h-4 w-4 mr-2" />DOT Visits</TabsTrigger>
                <TabsTrigger value="contacts"><Users className="h-4 w-4 mr-2" />Contact Tracing</TabsTrigger>
              </TabsList>
              <TabsContent value="dot"><DotTab caseId={selectedCase.id} hospitalId={hospitalId} /></TabsContent>
              <TabsContent value="contacts"><ContactsTab caseId={selectedCase.id} hospitalId={hospitalId} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DotTab({ caseId, hospitalId }: { caseId: string; hospitalId: string | null }) {
  const { data: visits } = useTbDotVisits(caseId);
  const add = useAddTbDot();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ visit_date: format(new Date(), "yyyy-MM-dd"), doses_taken: 0, doses_missed: 0 });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, tb_case_id: caseId, hospital_id: hospitalId,
        doses_taken: +f.doses_taken, doses_missed: +f.doses_missed });
      toast({ title: "DOT visit logged" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Log visit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>DOT Visit</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={f.visit_date} onChange={e => setF({ ...f, visit_date: e.target.value })} /></div>
              <div><Label>Doses taken</Label><Input type="number" value={f.doses_taken} onChange={e => setF({ ...f, doses_taken: e.target.value })} /></div>
              <div><Label>Doses missed</Label><Input type="number" value={f.doses_missed} onChange={e => setF({ ...f, doses_missed: e.target.value })} /></div>
              <div className="col-span-2"><Label>Adverse events</Label><Textarea value={f.adverse_events || ""} onChange={e => setF({ ...f, adverse_events: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Taken</TableHead><TableHead>Missed</TableHead><TableHead>AE</TableHead></TableRow></TableHeader>
        <TableBody>
          {!visits?.length ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No visits</TableCell></TableRow> :
            visits.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell>{format(new Date(v.visit_date), "MMM d, yyyy")}</TableCell>
                <TableCell>{v.doses_taken}</TableCell>
                <TableCell>{v.doses_missed}</TableCell>
                <TableCell className="text-xs">{v.adverse_events || "—"}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ContactsTab({ caseId, hospitalId }: { caseId: string; hospitalId: string | null }) {
  const { data: contacts } = useTbContacts(caseId);
  const add = useAddTbContact();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ contact_name: "", treatment_started: false });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, tb_case_id: caseId, hospital_id: hospitalId,
        age: f.age ? +f.age : null });
      toast({ title: "Contact added" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Contact</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={f.contact_name} onChange={e => setF({ ...f, contact_name: e.target.value })} /></div>
              <div><Label>Relationship</Label><Input value={f.relationship || ""} onChange={e => setF({ ...f, relationship: e.target.value })} /></div>
              <div><Label>Age</Label><Input type="number" value={f.age || ""} onChange={e => setF({ ...f, age: e.target.value })} /></div>
              <div><Label>Screening date</Label><Input type="date" value={f.screening_date || ""} onChange={e => setF({ ...f, screening_date: e.target.value })} /></div>
              <div><Label>Result</Label><Input value={f.screening_result || ""} onChange={e => setF({ ...f, screening_result: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={!f.contact_name || add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Relation</TableHead><TableHead>Age</TableHead><TableHead>Screened</TableHead><TableHead>Result</TableHead><TableHead>On Tx</TableHead></TableRow></TableHeader>
        <TableBody>
          {!contacts?.length ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No contacts</TableCell></TableRow> :
            contacts.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.contact_name}</TableCell>
                <TableCell>{c.relationship || "—"}</TableCell>
                <TableCell>{c.age ?? "—"}</TableCell>
                <TableCell>{c.screening_date || "—"}</TableCell>
                <TableCell>{c.screening_result || "—"}</TableCell>
                <TableCell>{c.treatment_started ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
