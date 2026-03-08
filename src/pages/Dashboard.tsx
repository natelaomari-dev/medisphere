import { StatCard } from "@/components/StatCard";
import { Users, BedDouble, Brain, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { usePatients, useAIAlerts, useAppointments } from "@/hooks/useHospitalData";

const admissionData = [
  { name: "Mon", admissions: 42, discharges: 38 },
  { name: "Tue", admissions: 55, discharges: 45 },
  { name: "Wed", admissions: 48, discharges: 52 },
  { name: "Thu", admissions: 62, discharges: 49 },
  { name: "Fri", admissions: 58, discharges: 55 },
  { name: "Sat", admissions: 35, discharges: 40 },
  { name: "Sun", admissions: 30, discharges: 32 },
];

const departmentLoad = [
  { name: "ER", patients: 34 },
  { name: "ICU", patients: 18 },
  { name: "Surgery", patients: 25 },
  { name: "Pediatrics", patients: 22 },
  { name: "Cardiology", patients: 15 },
  { name: "Oncology", patients: 12 },
];

const COLORS = ["hsl(220, 70%, 50%)", "hsl(220, 14%, 90%)"];

const severityDot: Record<string, string> = {
  critical: "bg-critical",
  high: "bg-critical",
  medium: "bg-warning",
  low: "bg-info",
};

export default function Dashboard() {
  const { data: patients = [] } = usePatients();
  const { data: alerts = [] } = useAIAlerts();
  const { data: appointments = [] } = useAppointments();

  const inpatients = patients.filter(p => ["inpatient", "icu"].includes(p.status || ""));
  const criticalAlerts = alerts.filter((a: any) => a.severity === "critical" || a.severity === "high");
  const totalBeds = 312;
  const occupiedBeds = Math.min(inpatients.length * 12 + 210, totalBeds); // simulated scale
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);
  const bedData = [
    { name: "Occupied", value: occupancyPct },
    { name: "Available", value: 100 - occupancyPct },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Hospital Command Center</h1>
          <p className="text-sm text-muted-foreground">Real-time overview · Lagos General Hospital</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live · Updated just now
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients.length} change={`${inpatients.length} admitted`} changeType="neutral" icon={Users} subtitle="Active records" />
        <StatCard title="Bed Occupancy" value={`${occupancyPct}%`} change={`${totalBeds - occupiedBeds} beds available`} changeType="neutral" icon={BedDouble} subtitle={`${totalBeds} total beds`} />
        <StatCard title="Appointments Today" value={appointments.length} change="View schedule" changeType="neutral" icon={Clock} subtitle="All departments" />
        <StatCard title="AI Alerts" value={alerts.length} change={`${criticalAlerts.length} critical`} changeType={criticalAlerts.length > 0 ? "negative" : "neutral"} icon={Brain} subtitle="Requires attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Admissions vs Discharges</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={admissionData}>
              <defs>
                <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="admissions" stroke="hsl(220, 70%, 50%)" fill="url(#admGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="discharges" stroke="hsl(142, 72%, 40%)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Bed Occupancy</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bedData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {bedData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {bedData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {item.name}: {item.value}%
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Department Patient Load</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={departmentLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="patients" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">AI Smart Alerts</h3>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Hospital Brain</span>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No active alerts</p>
            ) : alerts.slice(0, 5).map((alert: any) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${severityDot[alert.severity] || "bg-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                  {alert.patients && (
                    <p className="text-[10px] text-primary mt-1">{alert.patients.first_name} {alert.patients.last_name} ({alert.patients.patient_id})</p>
                  )}
                </div>
                {alert.confidence && (
                  <span className="text-[10px] font-medium text-muted-foreground shrink-0">{alert.confidence}%</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
