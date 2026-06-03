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
import { usePatients } from "@/hooks/useHospitalData";
import { useDoctors } from "@/hooks/useHospitalData";
import { useMedicalRecords, useCreateMedicalRecord, useAddDiagnosis, useRecordVitals, useVitals, useDiagnoses, useUpdateMedicalRecord } from "@/hooks/useEMR";
import { format } from "date-fns";
import { FileText, Plus, Search, Stethoscope, Activity, ClipboardList, Heart, Thermometer, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderSets, useApplyOrderSet } from "@/hooks/useClinicalModules";

const statusStyles: Record<string, string> = {
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  signed: "bg-primary/10 text-primary border-primary/20",
};

const visitTypeStyles: Record<string, string> = {
  outpatient: "bg-info/10 text-info border-info/20",
  inpatient: "bg-warning/10 text-warning border-warning/20",
  emergency: "bg-critical/10 text-critical border-critical/20",
};

export default function MedicalRecords() {
  const { toast } = useToast();
  const { hospitalId } = useHospital();
  const { data: records, isLoading } = useMedicalRecords();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createRecord = useCreateMedicalRecord();
  const updateRecord = useUpdateMedicalRecord();
  const addDiagnosis = useAddDiagnosis();
  const recordVitals = useRecordVitals();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", visit_type: "outpatient",
    chief_complaint: "", history_of_present_illness: "",
    physical_examination: "", assessment: "", treatment_plan: "",
  });

  const [diagForm, setDiagForm] = useState({ icd_code: "", icd_description: "", diagnosis_type: "primary", notes: "" });
  const [vitalsForm, setVitalsForm] = useState({
    blood_pressure_systolic: "", blood_pressure_diastolic: "", heart_rate: "",
    temperature: "", respiratory_rate: "", spo2: "", weight: "", height: "", pain_level: "",
  });

  const filtered = records?.filter((r: any) => {
    const name = `${r.patients?.first_name} ${r.patients?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || r.patients?.patient_id?.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    try {
      await createRecord.mutateAsync({ ...form, hospital_id: hospitalId || undefined });
      setShowCreate(false);
      setForm({ patient_id: "", doctor_id: "", visit_type: "outpatient", chief_complaint: "", history_of_present_illness: "", physical_examination: "", assessment: "", treatment_plan: "" });
      toast({ title: "Medical record created" });
    } catch { toast({ title: "Error creating record", variant: "destructive" }); }
  };

  const handleAddDiagnosis = async () => {
    if (!selectedRecord) return;
    try {
      await addDiagnosis.mutateAsync({ ...diagForm, medical_record_id: selectedRecord, hospital_id: hospitalId || undefined });
      setShowDiagnosis(false);
      setDiagForm({ icd_code: "", icd_description: "", diagnosis_type: "primary", notes: "" });
      toast({ title: "Diagnosis added" });
    } catch { toast({ title: "Error adding diagnosis", variant: "destructive" }); }
  };

  const handleRecordVitals = async () => {
    const rec = records?.find((r: any) => r.id === selectedRecord);
    if (!rec) return;
    try {
      const v: any = {};
      Object.entries(vitalsForm).forEach(([k, val]) => { if (val) v[k] = Number(val); });
      await recordVitals.mutateAsync({ ...v, patient_id: rec.patient_id, medical_record_id: selectedRecord || undefined, hospital_id: hospitalId || undefined });
      setShowVitals(false);
      setVitalsForm({ blood_pressure_systolic: "", blood_pressure_diastolic: "", heart_rate: "", temperature: "", respiratory_rate: "", spo2: "", weight: "", height: "", pain_level: "" });
      toast({ title: "Vitals recorded" });
    } catch { toast({ title: "Error recording vitals", variant: "destructive" }); }
  };

  const inProgress = records?.filter((r: any) => r.status === "in_progress").length || 0;
  const completed = records?.filter((r: any) => r.status === "completed").length || 0;
  const signed = records?.filter((r: any) => r.status === "signed").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Electronic Medical Records</h1>
          <p className="text-sm text-muted-foreground">Consultation notes, diagnoses & treatment plans</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Consultation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Medical Record</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{patients?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Doctor</Label>
                <Select value={form.doctor_id} onValueChange={v => setForm(p => ({ ...p, doctor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>{doctors?.map((d: any) => <SelectItem key={d.id} value={d.id}>Dr. {d.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visit Type</Label>
                <Select value={form.visit_type} onValueChange={v => setForm(p => ({ ...p, visit_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div><Label>Chief Complaint</Label><Textarea value={form.chief_complaint} onChange={e => setForm(p => ({ ...p, chief_complaint: e.target.value }))} placeholder="Patient's main complaint..." /></div>
              <div><Label>History of Present Illness</Label><Textarea value={form.history_of_present_illness} onChange={e => setForm(p => ({ ...p, history_of_present_illness: e.target.value }))} placeholder="Detailed history..." /></div>
              <div><Label>Physical Examination</Label><Textarea value={form.physical_examination} onChange={e => setForm(p => ({ ...p, physical_examination: e.target.value }))} placeholder="Examination findings..." /></div>
              <div><Label>Assessment</Label><Textarea value={form.assessment} onChange={e => setForm(p => ({ ...p, assessment: e.target.value }))} placeholder="Clinical assessment..." /></div>
              <div><Label>Treatment Plan</Label><Textarea value={form.treatment_plan} onChange={e => setForm(p => ({ ...p, treatment_plan: e.target.value }))} placeholder="Treatment plan..." /></div>
            </div>
            <Button onClick={handleCreate} disabled={!form.patient_id || createRecord.isPending} className="w-full mt-4">
              {createRecord.isPending ? "Creating..." : "Create Record"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><FileText className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{records?.length || 0}</p><p className="text-xs text-muted-foreground">Total Records</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><ClipboardList className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Stethoscope className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Activity className="h-8 w-8 text-info" /><div><p className="text-2xl font-bold">{signed}</p><p className="text-xs text-muted-foreground">Signed Off</p></div></CardContent></Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by patient name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading records...</TableCell></TableRow>
              ) : !filtered?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.patients?.first_name} {r.patients?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{r.patients?.patient_id}</div>
                  </TableCell>
                  <TableCell>Dr. {r.doctors?.full_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={visitTypeStyles[r.visit_type] || ""}>{r.visit_type}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.chief_complaint || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusStyles[r.status] || ""}>{r.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedRecord(r.id); setShowDiagnosis(true); }}>
                        <Plus className="h-3 w-3 mr-1" />Dx
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedRecord(r.id); setShowVitals(true); }}>
                        <Heart className="h-3 w-3 mr-1" />Vitals
                      </Button>
                      {r.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          await updateRecord.mutateAsync({ id: r.id, status: "completed" });
                          toast({ title: "Record completed" });
                        }}>Complete</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Diagnosis Dialog */}
      <Dialog open={showDiagnosis} onOpenChange={setShowDiagnosis}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Diagnosis (ICD-10)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ICD-10 Code</Label><Input placeholder="e.g. J06.9" value={diagForm.icd_code} onChange={e => setDiagForm(p => ({ ...p, icd_code: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={diagForm.diagnosis_type} onValueChange={v => setDiagForm(p => ({ ...p, diagnosis_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="differential">Differential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Input placeholder="Diagnosis description" value={diagForm.icd_description} onChange={e => setDiagForm(p => ({ ...p, icd_description: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea placeholder="Additional notes..." value={diagForm.notes} onChange={e => setDiagForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <Button onClick={handleAddDiagnosis} disabled={!diagForm.icd_code || !diagForm.icd_description} className="w-full">Add Diagnosis</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Vitals Dialog */}
      <Dialog open={showVitals} onOpenChange={setShowVitals}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Vitals</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>BP Systolic (mmHg)</Label><Input type="number" value={vitalsForm.blood_pressure_systolic} onChange={e => setVitalsForm(p => ({ ...p, blood_pressure_systolic: e.target.value }))} /></div>
            <div><Label>BP Diastolic (mmHg)</Label><Input type="number" value={vitalsForm.blood_pressure_diastolic} onChange={e => setVitalsForm(p => ({ ...p, blood_pressure_diastolic: e.target.value }))} /></div>
            <div><Label>Heart Rate (bpm)</Label><Input type="number" value={vitalsForm.heart_rate} onChange={e => setVitalsForm(p => ({ ...p, heart_rate: e.target.value }))} /></div>
            <div><Label>Temperature (°C)</Label><Input type="number" step="0.1" value={vitalsForm.temperature} onChange={e => setVitalsForm(p => ({ ...p, temperature: e.target.value }))} /></div>
            <div><Label>Resp. Rate (/min)</Label><Input type="number" value={vitalsForm.respiratory_rate} onChange={e => setVitalsForm(p => ({ ...p, respiratory_rate: e.target.value }))} /></div>
            <div><Label>SpO₂ (%)</Label><Input type="number" value={vitalsForm.spo2} onChange={e => setVitalsForm(p => ({ ...p, spo2: e.target.value }))} /></div>
            <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={vitalsForm.weight} onChange={e => setVitalsForm(p => ({ ...p, weight: e.target.value }))} /></div>
            <div><Label>Height (cm)</Label><Input type="number" step="0.1" value={vitalsForm.height} onChange={e => setVitalsForm(p => ({ ...p, height: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Pain Level (0-10)</Label><Input type="number" min="0" max="10" value={vitalsForm.pain_level} onChange={e => setVitalsForm(p => ({ ...p, pain_level: e.target.value }))} /></div>
          </div>
          <Button onClick={handleRecordVitals} className="w-full mt-2">Save Vitals</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
