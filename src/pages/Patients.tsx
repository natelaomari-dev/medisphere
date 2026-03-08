import { useState } from "react";
import { Search, Filter, Plus, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePatients, useAddPatient } from "@/hooks/useHospitalData";
import { toast } from "sonner";

const riskColors = { low: "bg-success/10 text-success", medium: "bg-warning/10 text-warning", high: "bg-critical/10 text-critical", critical: "bg-critical/10 text-critical" };
const statusColors: Record<string, string> = { outpatient: "text-info", inpatient: "text-primary", icu: "text-critical", discharged: "text-success", deceased: "text-muted-foreground" };

export default function Patients() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
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
      await addPatient.mutateAsync(form);
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
                <tr key={patient.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
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
