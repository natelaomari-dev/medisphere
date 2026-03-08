import { useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, Activity, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const patients = [
  { id: "P-1001", name: "Amina Bello", age: 34, gender: "F", ward: "Cardiology", status: "stable", risk: "low", lastVisit: "Today" },
  { id: "P-1002", name: "Kwame Asante", age: 58, gender: "M", ward: "ICU", status: "critical", risk: "high", lastVisit: "Today" },
  { id: "P-1003", name: "Fatima Diallo", age: 27, gender: "F", ward: "Maternity", status: "stable", risk: "medium", lastVisit: "Yesterday" },
  { id: "P-1004", name: "Joseph Mwangi", age: 45, gender: "M", ward: "Surgery", status: "recovering", risk: "low", lastVisit: "Today" },
  { id: "P-1005", name: "Grace Okafor", age: 62, gender: "F", ward: "Oncology", status: "monitoring", risk: "high", lastVisit: "2 days ago" },
  { id: "P-1006", name: "David Nyong'o", age: 38, gender: "M", ward: "ER", status: "critical", risk: "high", lastVisit: "Today" },
  { id: "P-1007", name: "Chioma Eze", age: 29, gender: "F", ward: "Pediatrics", status: "stable", risk: "low", lastVisit: "Today" },
  { id: "P-1008", name: "Ibrahim Kamara", age: 51, gender: "M", ward: "Cardiology", status: "monitoring", risk: "medium", lastVisit: "Yesterday" },
];

const riskColors = { low: "bg-success/10 text-success", medium: "bg-warning/10 text-warning", high: "bg-critical/10 text-critical" };
const statusColors = { stable: "text-success", critical: "text-critical", recovering: "text-info", monitoring: "text-warning" };

export default function Patients() {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">1,247 total patients · 89 active admissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Patient</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">ID</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Ward</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Status</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">AI Risk</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Last Visit</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient) => (
              <tr key={patient.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {patient.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{patient.name}</p>
                      <p className="text-[11px] text-muted-foreground">{patient.age}y · {patient.gender}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{patient.id}</td>
                <td className="px-5 py-3.5 text-sm text-foreground hidden md:table-cell">{patient.ward}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className={`text-xs font-medium capitalize ${statusColors[patient.status as keyof typeof statusColors] || "text-muted-foreground"}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${riskColors[patient.risk as keyof typeof riskColors]}`}>
                    {patient.risk}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{patient.lastVisit}</td>
                <td className="px-5 py-3.5">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
