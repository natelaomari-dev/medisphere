import { Users, Calendar, BedDouble, Siren, Heart, Baby, Activity, Bone, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { usePatients, useAIAlerts, useAppointments } from "@/hooks/useHospitalData";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Link } from "react-router-dom";

const statusStyles: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  outpatient: { dot: "bg-success", text: "text-success", bg: "bg-success/10", label: "Stable" },
  inpatient:  { dot: "bg-warning", text: "text-warning", bg: "bg-warning/10", label: "Monitoring" },
  icu:        { dot: "bg-critical", text: "text-critical", bg: "bg-critical/10", label: "Critical" },
  maternity:  { dot: "bg-info", text: "text-info", bg: "bg-info/10", label: "In Labor" },
};

const deptDot: Record<string, string> = {
  Cardiology: "bg-success",
  Maternity: "bg-info",
  Emergency: "bg-warning",
  Orthopaedics: "bg-[hsl(270,40%,60%)]",
  Pediatrics: "bg-info",
  General: "bg-muted-foreground",
};

function StatCard({
  icon: Icon, iconBg, iconColor, value, label, delta, deltaType,
}: {
  icon: any; iconBg: string; iconColor: string; value: string | number; label: string;
  delta?: string; deltaType?: "up" | "down" | "neutral";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 stat-glow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.75} />
        </div>
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
            deltaType === "down" ? "text-critical bg-critical/10" : "text-success bg-success/10"
          }`}>
            {deltaType === "down" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-3xl font-display font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { hospitalId, hospitalName } = useHospital();
  const { user } = useAuth();
  const { data: patients = [] } = usePatients();
  const { data: alerts = [] } = useAIAlerts();
  const { data: appointments = [] } = useAppointments();

  const { data: beds = [] } = useQuery({
    queryKey: ["dash-beds", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("beds").select("is_available, ward_id, wards(name, ward_type)").eq("hospital_id", hospitalId!).eq("is_active", true);
      return data || [];
    },
  });

  const { data: vitals = [] } = useQuery({
    queryKey: ["dash-vitals", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("vitals").select("patient_id, temperature, heart_rate, created_at").eq("hospital_id", hospitalId!).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: medications = [] } = useQuery({
    queryKey: ["dash-meds", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("medications").select("name, category, stock_quantity, reorder_level").eq("hospital_id", hospitalId!).eq("is_active", true).order("stock_quantity", { ascending: true }).limit(6);
      return data || [];
    },
  });

  const todayAppointments = appointments.filter((a: any) => isToday(new Date(a.appointment_date)));
  const occupiedBeds = beds.filter((b: any) => !b.is_available).length;
  const totalBeds = beds.length;
  const emergencies = alerts.filter((a: any) => a.severity === "critical" || a.severity === "high").length;
  const recentPatients = patients.slice(0, 6);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const userName = user?.email?.split("@")[0]?.split(".")[0] || "Doctor";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const latestVitalByPatient = vitals.reduce((acc: any, v: any) => {
    if (!acc[v.patient_id]) acc[v.patient_id] = v;
    return acc;
  }, {});

  // Group beds by ward type for occupancy widget
  const wardTypes = ["cardiology", "maternity", "emergency", "orthopaedics"] as const;
  const wardMeta = {
    cardiology:    { label: "Cardiology",   icon: Heart,    color: "text-success",  bg: "bg-success/10",  bar: "bg-success" },
    maternity:     { label: "Maternity",    icon: Baby,     color: "text-info",     bg: "bg-info/10",     bar: "bg-info" },
    emergency:     { label: "Emergency",    icon: Activity, color: "text-warning",  bg: "bg-warning/10",  bar: "bg-warning" },
    orthopaedics:  { label: "Orthopaedics", icon: Bone,     color: "text-[hsl(270,40%,60%)]", bg: "bg-[hsl(270,40%,95%)]", bar: "bg-[hsl(270,40%,60%)]" },
  };
  const deptOccupancy = wardTypes.map((wt) => {
    const wardBeds = beds.filter((b: any) => (b.wards?.ward_type || "").toLowerCase() === wt);
    const total = wardBeds.length;
    const occ = wardBeds.filter((b: any) => !b.is_available).length;
    return { key: wt, ...wardMeta[wt], occupied: occ, total, pct: total ? Math.round((occ / total) * 100) : 0 };
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {greeting}, Dr. {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} · {hospitalName || "Your Hospital"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     iconBg="bg-success/10" iconColor="text-success" value={patients.length} label="Total patients today" delta="+12%" deltaType="up" />
        <StatCard icon={Calendar}  iconBg="bg-info/10"    iconColor="text-info"    value={todayAppointments.length} label="Appointments scheduled" delta="+5%" deltaType="up" />
        <StatCard icon={BedDouble} iconBg="bg-warning/10" iconColor="text-warning" value={`${occupiedBeds}/${totalBeds || 0}`} label="Occupied beds" delta={`${totalBeds ? Math.round((occupiedBeds/totalBeds)*100) : 0}%`} deltaType="neutral" />
        <StatCard icon={Siren}     iconBg="bg-critical/10" iconColor="text-critical" value={emergencies} label="Emergency cases" delta={emergencies > 0 ? "live" : "calm"} deltaType={emergencies > 0 ? "up" : "down"} />
      </div>

      {/* Patients table + schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Patients</h2>
            <Link to="/patients" className="text-xs font-medium text-primary hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40">
                  <th className="text-left font-medium px-5 py-2.5">Patient</th>
                  <th className="text-left font-medium px-5 py-2.5">Department</th>
                  <th className="text-left font-medium px-5 py-2.5">Vitals</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No patients yet</td></tr>
                )}
                {recentPatients.map((p: any) => {
                  const status = statusStyles[p.status || "outpatient"] || statusStyles.outpatient;
                  const v = latestVitalByPatient[p.id];
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/patients/${p.id}`} className="block">
                          <p className="font-semibold text-foreground">{p.first_name} {p.last_name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.patient_id}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {p.ward || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {v ? (
                          <span className="text-xs">
                            <span className="font-semibold">{v.temperature ?? "—"}°C</span>
                            <span className="text-muted-foreground"> · {v.heart_rate ?? "—"} bpm</span>
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">Today's Schedule</h2>
            <Link to="/appointments" className="text-xs font-medium text-primary hover:underline">All →</Link>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {todayAppointments.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No appointments today</p>
            )}
            {todayAppointments.slice(0, 8).map((a: any) => {
              const dt = new Date(a.appointment_date);
              const dept = a.doctors?.specialization || "General";
              return (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="text-right shrink-0 w-12">
                    <p className="text-sm font-bold text-foreground leading-none">{format(dt, "h:mm")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(dt, "a")}</p>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${deptDot[dept] || deptDot.General}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.patients?.first_name} {a.patients?.last_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.type || "Consultation"}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground shrink-0 text-right max-w-[100px] truncate">
                    Dr. {a.doctors?.full_name?.split(" ").slice(-1)[0] || "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Department occupancy + Pharmacy alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Department Occupancy</h2>
            <Link to="/inpatients" className="text-xs font-medium text-primary hover:underline">Manage →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {deptOccupancy.map((d) => (
              <div key={d.key} className={`rounded-lg border border-border p-4 ${d.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <d.icon className={`h-5 w-5 ${d.color}`} strokeWidth={1.75} />
                  <span className="text-[10px] font-semibold text-muted-foreground">{d.pct}%</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{d.label}</p>
                <p className="text-[11px] text-muted-foreground mb-2">{d.occupied} of {d.total || 0} beds</p>
                <div className="h-1.5 w-full rounded-full bg-background/60 overflow-hidden">
                  <div className={`h-full ${d.bar} rounded-full transition-all`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Pharmacy Alerts</h2>
            <Link to="/pharmacy" className="text-xs font-medium text-primary hover:underline">View stock →</Link>
          </div>
          <div className="space-y-3">
            {medications.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">No medication data</p>
            )}
            {medications.map((m: any) => {
              const ratio = m.reorder_level > 0 ? Math.min(100, Math.round((m.stock_quantity / (m.reorder_level * 3)) * 100)) : 100;
              const tone = m.stock_quantity === 0 ? "critical" : m.stock_quantity <= m.reorder_level ? "warning" : "success";
              const barColor = tone === "critical" ? "bg-critical" : tone === "warning" ? "bg-warning" : "bg-success";
              return (
                <div key={m.name} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{m.category}</p>
                      </div>
                      <p className={`text-xs font-semibold tabular-nums shrink-0 ${
                        tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-success"
                      }`}>
                        {m.stock_quantity} units
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
