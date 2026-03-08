import { StatCard } from "@/components/StatCard";
import {
  Users, BedDouble, Activity, Clock, Stethoscope, AlertTriangle,
  TrendingUp, Heart, Brain, Pill,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

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

const bedOccupancy = [
  { name: "Occupied", value: 78 },
  { name: "Available", value: 22 },
];

const COLORS = ["hsl(220, 70%, 50%)", "hsl(220, 14%, 90%)"];

const alerts = [
  { id: 1, type: "critical", message: "ICU Bed 7: Patient vitals deteriorating — sepsis risk elevated", time: "2 min ago" },
  { id: 2, type: "warning", message: "Pharmacy: Amoxicillin stock below threshold (23 units)", time: "15 min ago" },
  { id: 3, type: "info", message: "AI Triage: 3 patients reclassified to high priority", time: "28 min ago" },
  { id: 4, type: "warning", message: "Lab turnaround exceeding SLA for CBC panels", time: "45 min ago" },
];

export default function Dashboard() {
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value="1,247" change="+12% from last week" changeType="positive" icon={Users} subtitle="Active admissions" />
        <StatCard title="Bed Occupancy" value="78%" change="6 beds available" changeType="neutral" icon={BedDouble} subtitle="312 total beds" />
        <StatCard title="ER Wait Time" value="14 min" change="-23% improved" changeType="positive" icon={Clock} subtitle="Average today" />
        <StatCard title="AI Alerts" value="7" change="3 critical" changeType="negative" icon={Brain} subtitle="Requires attention" />
      </div>

      {/* Charts Row */}
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
                <Pie data={bedOccupancy} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {bedOccupancy.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {bedOccupancy.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {item.name}: {item.value}%
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Load */}
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

        {/* AI Alerts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">AI Smart Alerts</h3>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Hospital Brain</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  alert.type === "critical" ? "bg-critical" :
                  alert.type === "warning" ? "bg-warning" : "bg-info"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
