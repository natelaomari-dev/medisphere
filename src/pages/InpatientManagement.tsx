import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/hooks/useHospital";
import { usePatients, useDoctors } from "@/hooks/useHospitalData";
import { useWards, useCreateWard, useBeds, useCreateBed, useAdmissions, useCreateAdmission, useDischargePatient, useNurseNotes, useAddNurseNote } from "@/hooks/useInpatient";
import { format } from "date-fns";
import { BedDouble, Plus, Search, Users, ClipboardList, LogOut, Activity } from "lucide-react";

const admissionStatusStyles: Record<string, string> = {
  admitted: "bg-warning/10 text-warning border-warning/20",
  discharged: "bg-success/10 text-success border-success/20",
  transferred: "bg-info/10 text-info border-info/20",
  deceased: "bg-critical/10 text-critical border-critical/20",
};

const wardTypeStyles: Record<string, string> = {
  general: "bg-muted text-muted-foreground", maternity: "bg-pink-500/10 text-pink-600",
  paediatric: "bg-blue-500/10 text-blue-600", surgical: "bg-red-500/10 text-red-600",
  icu: "bg-critical/10 text-critical", isolation: "bg-warning/10 text-warning",
  private: "bg-primary/10 text-primary",
};

export default function InpatientManagement() {
  const { toast } = useToast();
  const { hospitalId } = useHospital();
  const { data: wards } = useWards();
  const { data: beds } = useBeds();
  const { data: admissions, isLoading } = useAdmissions();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createWard = useCreateWard();
  const createBed = useCreateBed();
  const createAdmission = useCreateAdmission();
  const dischargePatient = useDischargePatient();
  const addNurseNote = useAddNurseNote();

  const [tab, setTab] = useState("admissions");
  const [search, setSearch] = useState("");
  const [showAdmit, setShowAdmit] = useState(false);
  const [showWard, setShowWard] = useState(false);
  const [showBed, setShowBed] = useState(false);
  const [showDischarge, setShowDischarge] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<{ admissionId: string; patientId: string } | null>(null);
  const [noteForm, setNoteForm] = useState({ note_type: "general", content: "", shift: "morning" });
  const [dischargeForm, setDischargeForm] = useState({ discharge_summary: "", discharge_diagnosis: "" });

  const [admitForm, setAdmitForm] = useState({
    patient_id: "", ward_id: "", bed_id: "", admitting_doctor_id: "",
    admission_reason: "", admission_type: "elective", expected_discharge_date: "",
  });
  const [wardForm, setWardForm] = useState({ name: "", ward_type: "general", floor: "", total_beds: "0" });
  const [bedForm, setBedForm] = useState({ ward_id: "", bed_number: "", bed_type: "standard" });

  const availableBeds = beds?.filter((b: any) => b.is_available && b.ward_id === admitForm.ward_id) || [];
  const activeAdmissions = admissions?.filter((a: any) => a.status === "admitted") || [];
  const totalBeds = beds?.length || 0;
  const occupiedBeds = beds?.filter((b: any) => !b.is_available).length || 0;

  const filteredAdmissions = admissions?.filter((a: any) => {
    const name = `${a.patients?.first_name} ${a.patients?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.patients?.patient_id?.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdmit = async () => {
    if (!hospitalId) return;
    try {
      await createAdmission.mutateAsync({
        ...admitForm, hospital_id: hospitalId,
        bed_id: admitForm.bed_id || undefined,
        admitting_doctor_id: admitForm.admitting_doctor_id || undefined,
        expected_discharge_date: admitForm.expected_discharge_date || undefined,
      });
      setShowAdmit(false);
      setAdmitForm({ patient_id: "", ward_id: "", bed_id: "", admitting_doctor_id: "", admission_reason: "", admission_type: "elective", expected_discharge_date: "" });
      toast({ title: "Patient admitted successfully" });
    } catch { toast({ title: "Error admitting patient", variant: "destructive" }); }
  };

  const handleDischarge = async (id: string, bedId?: string) => {
    try {
      await dischargePatient.mutateAsync({ id, bed_id: bedId, ...dischargeForm });
      setShowDischarge(null);
      setDischargeForm({ discharge_summary: "", discharge_diagnosis: "" });
      toast({ title: "Patient discharged" });
    } catch { toast({ title: "Error discharging patient", variant: "destructive" }); }
  };

  const handleAddNote = async () => {
    if (!showNotes || !hospitalId) return;
    try {
      await addNurseNote.mutateAsync({
        admission_id: showNotes.admissionId, patient_id: showNotes.patientId,
        hospital_id: hospitalId, ...noteForm,
      });
      setNoteForm({ note_type: "general", content: "", shift: "morning" });
      toast({ title: "Note added" });
    } catch { toast({ title: "Error adding note", variant: "destructive" }); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inpatient Management</h1>
          <p className="text-sm text-muted-foreground">Ward, bed & admission management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showWard} onOpenChange={setShowWard}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add Ward</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Ward</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Ward Name</Label><Input value={wardForm.name} onChange={e => setWardForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Male Medical Ward" /></div>
                <div><Label>Ward Type</Label>
                  <Select value={wardForm.ward_type} onValueChange={v => setWardForm(p => ({ ...p, ward_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["general", "maternity", "paediatric", "surgical", "icu", "isolation", "private"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Floor</Label><Input value={wardForm.floor} onChange={e => setWardForm(p => ({ ...p, floor: e.target.value }))} placeholder="e.g. 2nd Floor" /></div>
                <Button onClick={async () => {
                  if (!hospitalId) return;
                  await createWard.mutateAsync({ hospital_id: hospitalId, ...wardForm, total_beds: Number(wardForm.total_beds) });
                  setShowWard(false); setWardForm({ name: "", ward_type: "general", floor: "", total_beds: "0" });
                  toast({ title: "Ward created" });
                }} disabled={!wardForm.name} className="w-full">Create Ward</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showBed} onOpenChange={setShowBed}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add Bed</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Bed</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Ward</Label>
                  <Select value={bedForm.ward_id} onValueChange={v => setBedForm(p => ({ ...p, ward_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>{wards?.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Bed Number</Label><Input value={bedForm.bed_number} onChange={e => setBedForm(p => ({ ...p, bed_number: e.target.value }))} placeholder="e.g. B-101" /></div>
                <div><Label>Bed Type</Label>
                  <Select value={bedForm.bed_type} onValueChange={v => setBedForm(p => ({ ...p, bed_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["standard", "electric", "cot", "crib"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={async () => {
                  if (!hospitalId) return;
                  await createBed.mutateAsync({ ...bedForm, hospital_id: hospitalId });
                  setShowBed(false); setBedForm({ ward_id: "", bed_number: "", bed_type: "standard" });
                  toast({ title: "Bed added" });
                }} disabled={!bedForm.ward_id || !bedForm.bed_number} className="w-full">Add Bed</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAdmit} onOpenChange={setShowAdmit}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Admit Patient</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Admit Patient</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Patient</Label>
                  <Select value={admitForm.patient_id} onValueChange={v => setAdmitForm(p => ({ ...p, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>{patients?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Ward</Label>
                    <Select value={admitForm.ward_id} onValueChange={v => setAdmitForm(p => ({ ...p, ward_id: v, bed_id: "" }))}>
                      <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                      <SelectContent>{wards?.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Bed</Label>
                    <Select value={admitForm.bed_id} onValueChange={v => setAdmitForm(p => ({ ...p, bed_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Available beds" /></SelectTrigger>
                      <SelectContent>{availableBeds.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.bed_number}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Admitting Doctor</Label>
                  <Select value={admitForm.admitting_doctor_id} onValueChange={v => setAdmitForm(p => ({ ...p, admitting_doctor_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>{doctors?.map((d: any) => <SelectItem key={d.id} value={d.id}>Dr. {d.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Admission Type</Label>
                  <Select value={admitForm.admission_type} onValueChange={v => setAdmitForm(p => ({ ...p, admission_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elective">Elective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Admission Reason</Label><Textarea value={admitForm.admission_reason} onChange={e => setAdmitForm(p => ({ ...p, admission_reason: e.target.value }))} placeholder="Reason for admission..." /></div>
                <div><Label>Expected Discharge</Label><Input type="date" value={admitForm.expected_discharge_date} onChange={e => setAdmitForm(p => ({ ...p, expected_discharge_date: e.target.value }))} /></div>
                <Button onClick={handleAdmit} disabled={!admitForm.patient_id || !admitForm.ward_id || !admitForm.admission_reason} className="w-full">
                  {createAdmission.isPending ? "Admitting..." : "Admit Patient"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{activeAdmissions.length}</p><p className="text-xs text-muted-foreground">Active Admissions</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><BedDouble className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{totalBeds - occupiedBeds}</p><p className="text-xs text-muted-foreground">Available Beds</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Activity className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{occupiedBeds}</p><p className="text-xs text-muted-foreground">Occupied Beds</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><ClipboardList className="h-8 w-8 text-info" /><div><p className="text-2xl font-bold">{wards?.length || 0}</p><p className="text-xs text-muted-foreground">Active Wards</p></div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="wards">Wards & Beds</TabsTrigger>
        </TabsList>

        <TabsContent value="admissions" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search admissions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Admitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !filteredAdmissions?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No admissions found</TableCell></TableRow>
                  ) : filteredAdmissions.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.patients?.first_name} {a.patients?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{a.patients?.patient_id}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={wardTypeStyles[a.wards?.ward_type] || ""}>{a.wards?.name}</Badge></TableCell>
                      <TableCell>{a.beds?.bed_number || "—"}</TableCell>
                      <TableCell className="capitalize">{a.admission_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(a.admission_date), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className={admissionStatusStyles[a.status] || ""}>{a.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status === "admitted" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setShowNotes({ admissionId: a.id, patientId: a.patient_id })}>
                                <ClipboardList className="h-3 w-3 mr-1" />Notes
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowDischarge(a.id)}>
                                <LogOut className="h-3 w-3 mr-1" />Discharge
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards?.map((w: any) => {
              const wardBeds = beds?.filter((b: any) => b.ward_id === w.id) || [];
              const available = wardBeds.filter((b: any) => b.is_available).length;
              return (
                <Card key={w.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{w.name}</CardTitle>
                      <Badge variant="outline" className={wardTypeStyles[w.ward_type] || ""}>{w.ward_type}</Badge>
                    </div>
                    {w.floor && <p className="text-xs text-muted-foreground">{w.floor}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm">
                      <div><span className="font-semibold text-success">{available}</span> <span className="text-muted-foreground">available</span></div>
                      <div><span className="font-semibold text-warning">{wardBeds.length - available}</span> <span className="text-muted-foreground">occupied</span></div>
                      <div><span className="font-semibold">{wardBeds.length}</span> <span className="text-muted-foreground">total</span></div>
                    </div>
                    {wardBeds.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {wardBeds.map((b: any) => (
                          <span key={b.id} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${b.is_available ? "bg-success/10 text-success" : "bg-critical/10 text-critical"}`}>
                            {b.bed_number}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!wards?.length && <p className="text-muted-foreground col-span-full text-center py-8">No wards created yet. Add a ward to get started.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Discharge Dialog */}
      <Dialog open={!!showDischarge} onOpenChange={() => setShowDischarge(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Discharge Patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Discharge Summary</Label><Textarea value={dischargeForm.discharge_summary} onChange={e => setDischargeForm(p => ({ ...p, discharge_summary: e.target.value }))} placeholder="Discharge summary..." /></div>
            <div><Label>Discharge Diagnosis</Label><Input value={dischargeForm.discharge_diagnosis} onChange={e => setDischargeForm(p => ({ ...p, discharge_diagnosis: e.target.value }))} placeholder="Final diagnosis" /></div>
            <Button onClick={() => {
              const adm = admissions?.find((a: any) => a.id === showDischarge);
              if (showDischarge) handleDischarge(showDischarge, adm?.bed_id);
            }} className="w-full" variant="destructive">Confirm Discharge</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nurse Notes Dialog */}
      <Dialog open={!!showNotes} onOpenChange={() => setShowNotes(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nurse Notes</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Note Type</Label>
                <Select value={noteForm.note_type} onValueChange={v => setNoteForm(p => ({ ...p, note_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["observation", "medication", "procedure", "handover", "general"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Shift</Label>
                <Select value={noteForm.shift} onValueChange={v => setNoteForm(p => ({ ...p, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Note</Label><Textarea value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} placeholder="Enter observation or care note..." rows={4} /></div>
            <Button onClick={handleAddNote} disabled={!noteForm.content} className="w-full">Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
