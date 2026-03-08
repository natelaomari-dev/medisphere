import { useState } from "react";
import { Calendar, Plus, Clock, User, X, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppointments, usePatients, useDoctors } from "@/hooks/useHospitalData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const statusStyles: Record<string, string> = {
  scheduled: "bg-info/10 text-info",
  confirmed: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-critical/10 text-critical",
};

const typeStyles: Record<string, string> = {
  consultation: "text-primary",
  follow_up: "text-info",
  emergency: "text-critical",
  telemedicine: "text-success",
  procedure: "text-warning",
};

export default function Appointments() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "past">("today");
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: patients = [] } = usePatients();
  const { data: doctors = [] } = useDoctors();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", appointment_date: "", duration_minutes: 30,
    type: "consultation", reason: "",
  });

  const filtered = appointments.filter((a: any) => {
    const date = new Date(a.appointment_date);
    if (filter === "today") return isToday(date);
    if (filter === "upcoming") return !isPast(date);
    if (filter === "past") return isPast(date);
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_date: form.appointment_date,
      duration_minutes: form.duration_minutes,
      type: form.type,
      reason: form.reason,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Appointment scheduled");
    setShowAdd(false);
    setForm({ patient_id: "", doctor_id: "", appointment_date: "", duration_minutes: 30, type: "consultation", reason: "" });
    qc.invalidateQueries({ queryKey: ["appointments"] });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return `Today · ${format(d, "h:mm a")}`;
    if (isTomorrow(d)) return `Tomorrow · ${format(d, "h:mm a")}`;
    return format(d, "MMM d · h:mm a");
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">{appointments.length} total · {appointments.filter((a: any) => isToday(new Date(a.appointment_date))).length} today</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["today", "upcoming", "all", "past"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Schedule Appointment</h3>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</option>)}
                </select>
                <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.specialization}</option>)}
                </select>
                <input type="datetime-local" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="telemedicine">Telemedicine</option>
                    <option value="procedure">Procedure</option>
                  </select>
                  <select value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                <input type="text" placeholder="Reason for visit" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Schedule
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointments List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="glass-card p-12 text-center text-sm text-muted-foreground">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-sm text-muted-foreground">No appointments found for this filter.</div>
        ) : (
          filtered.map((apt: any) => (
            <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-center min-w-[60px]">
                    <span className="text-xs text-muted-foreground">{format(new Date(apt.appointment_date), "MMM d")}</span>
                    <span className="text-lg font-semibold text-foreground">{format(new Date(apt.appointment_date), "h:mm")}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(apt.appointment_date), "a")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-border" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </p>
                      <span className={`text-[10px] font-medium capitalize ${typeStyles[apt.type] || "text-muted-foreground"}`}>
                        {apt.type?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Stethoscope className="h-3 w-3" /> {apt.doctors?.full_name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {apt.duration_minutes} min
                      </span>
                    </div>
                    {apt.reason && <p className="text-[11px] text-muted-foreground mt-1">{apt.reason}</p>}
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[apt.status] || ""}`}>
                  {apt.status?.replace("_", " ")}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
