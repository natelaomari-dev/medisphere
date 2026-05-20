import { useState } from "react";
import { Search, Filter, Plus, ChevronRight, X, Phone, Mail, MapPin, Heart, AlertCircle, Calendar, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePatients, useAddPatient, useDeletePatient } from "@/hooks/useHospitalData";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useHospital } from "@/hooks/useHospital";
import { PatientConsents } from "@/components/PatientConsents";

const riskColors = { low: "bg-green-500/10 text-green-600", medium: "bg-amber-500/10 text-amber-600", high: "bg-red-500/10 text-red-600", critical: "bg-red-500/10 text-red-600" };
const statusColors: Record<string, string> = { outpatient: "text-blue-500", inpatient: "text-primary", icu: "text-red-500", discharged: "text-green-500", deceased: "text-muted-foreground" };

interface PatientType {
  id: string;
  first_name: string;
  last_name: string;
  patient_id: string;
  gender: string;
  date_of_birth: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_type: string | null;
  ward: string | null;
  status: string | null;
  risk_level: string | null;
  ai_risk_score: number | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
}

function PatientDetail({ patient, onClose }: { patient: PatientType; onClose: () => void }) {
  const { hospitalId } = useHospital();
  const deletePatient = useDeletePatient();

  const handleDelete = async () => {
    try {
      await deletePatient.mutateAsync(patient.id);
      toast.success("Patient deleted");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete patient");
    }
  };

  const { data: vitals = [] } = useQuery({
    queryKey: ["patient-vitals", patient.id],
    queryFn: async () => {
      const { data } = await supabase.from("vitals").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", patient.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("*, doctors(full_name)").eq("patient_id", patient.id).order("appointment_date", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["patient-records", patient.id],
    queryFn: async () => {
      const { data } = await supabase.from("medical_records").select("*, doctors(full_name)").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <p className="text-base font-semibold">{patient.first_name} {patient.last_name}</p>
              <p className="text-xs text-muted-foreground font-normal">{patient.patient_id} · {age}yrs · {patient.gender}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="capitalize">{patient.status || "outpatient"}</Badge>
          {patient.risk_level && (
            <Badge className={`capitalize ${riskColors[patient.risk_level as keyof typeof riskColors] || ""}`}>
              {patient.risk_level} risk
            </Badge>
          )}
          {patient.blood_type && <Badge variant="outline">{patient.blood_type}</Badge>}
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-5 text-sm">
          {patient.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {patient.phone}</div>}
          {patient.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {patient.email}</div>}
          {patient.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {patient.address}</div>}
          {patient.insurance_provider && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" /> {patient.insurance_provider} {patient.insurance_number && `(${patient.insurance_number})`}
            </div>
          )}
        </div>

        {/* Allergies & conditions */}
        {((patient.allergies && patient.allergies.length > 0) || (patient.chronic_conditions && patient.chronic_conditions.length > 0)) && (
          <div className="space-y-2 mb-5">
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Allergies</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((a, i) => <Badge key={i} variant="destructive" className="text-xs">{a}</Badge>)}
                </div>
              </div>
            )}
            {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Chronic Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronic_conditions.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Danger zone */}
        <div className="mb-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors">
                <Trash2 className="h-4 w-4" /> Delete Patient
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this patient?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes {patient.first_name} {patient.last_name} ({patient.patient_id}) and cannot be undone. Related medical records may be retained for compliance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deletePatient.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deletePatient.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Emergency contact */}
        {patient.emergency_contact_name && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border mb-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Emergency Contact</p>
            <p className="text-sm text-foreground">{patient.emergency_contact_name}</p>
            {patient.emergency_contact_phone && <p className="text-xs text-muted-foreground">{patient.emergency_contact_phone}</p>}
          </div>
        )}

        <Tabs defaultValue="vitals" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="vitals" className="flex-1 text-xs">Vitals</TabsTrigger>
            <TabsTrigger value="appointments" className="flex-1 text-xs">Appointments</TabsTrigger>
            <TabsTrigger value="records" className="flex-1 text-xs">Records</TabsTrigger>
            <TabsTrigger value="consents" className="flex-1 text-xs">Consents</TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-2 mt-3">
            {vitals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No vitals recorded</p>
            ) : vitals.map(v => (
              <div key={v.id} className="p-3 rounded-lg border border-border text-xs space-y-1">
                <p className="text-muted-foreground">{format(new Date(v.created_at), "MMM d, yyyy h:mm a")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {v.blood_pressure_systolic && <div><span className="text-muted-foreground">BP:</span> <span className="text-foreground font-medium">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span></div>}
                  {v.heart_rate && <div><span className="text-muted-foreground">HR:</span> <span className="text-foreground font-medium">{v.heart_rate}</span></div>}
                  {v.temperature && <div><span className="text-muted-foreground">Temp:</span> <span className="text-foreground font-medium">{v.temperature}°C</span></div>}
                  {v.spo2 && <div><span className="text-muted-foreground">SpO2:</span> <span className="text-foreground font-medium">{v.spo2}%</span></div>}
                  {v.respiratory_rate && <div><span className="text-muted-foreground">RR:</span> <span className="text-foreground font-medium">{v.respiratory_rate}</span></div>}
                  {v.weight && <div><span className="text-muted-foreground">Wt:</span> <span className="text-foreground font-medium">{v.weight}kg</span></div>}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="appointments" className="space-y-2 mt-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No appointments</p>
            ) : appointments.map(a => (
              <div key={a.id} className="p-3 rounded-lg border border-border text-xs flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">{format(new Date(a.appointment_date), "MMM d, yyyy h:mm a")}</p>
                  <p className="text-muted-foreground">Dr. {(a.doctors as any)?.full_name || "—"} · {a.type || "Consultation"}</p>
                </div>
                <Badge variant="outline" className="capitalize text-xs">{a.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="records" className="space-y-2 mt-3">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No medical records</p>
            ) : records.map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-medium capitalize">{r.visit_type}</p>
                  <p className="text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                </div>
                {r.chief_complaint && <p className="text-muted-foreground">CC: {r.chief_complaint}</p>}
                {r.assessment && <p className="text-muted-foreground">Assessment: {r.assessment}</p>}
                <p className="text-muted-foreground">Dr. {(r.doctors as any)?.full_name || "—"}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="consents" className="mt-3">
            <PatientConsents patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default function Patients() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientType | null>(null);
  const { data: patients = [], isLoading } = usePatients();
  const addPatient = useAddPatient();

  const [form, setForm] = useState({ first_name: "", last_name: "", date_of_birth: "", gender: "M" as string, phone: "", ward: "" });

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPatient.mutateAsync(form as any);
      setShowAdd(false);
      setForm({ first_name: "", last_name: "", date_of_birth: "", gender: "M", phone: "", ward: "" });
      toast.success("Patient added successfully");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">{patients.length} total patients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Add New Patient</h3>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="text" placeholder="Ward" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" disabled={addPatient.isPending} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {addPatient.isPending ? "Adding..." : "Add Patient"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Detail Sheet */}
      {selectedPatient && <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {patients.length === 0 ? "No patients yet. Add your first patient." : "No patients match your search."}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Patient</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">ID</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Ward</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Status</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">AI Risk</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient as PatientType)}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{patient.first_name} {patient.last_name}</p>
                        <p className="text-[11px] text-muted-foreground">{patient.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{patient.patient_id}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground hidden md:table-cell">{patient.ward || "—"}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className={`text-xs font-medium capitalize ${statusColors[patient.status || ""] || "text-muted-foreground"}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${riskColors[patient.risk_level as keyof typeof riskColors] || "bg-muted text-muted-foreground"}`}>
                      {patient.risk_level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
