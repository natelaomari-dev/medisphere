import { StatCard } from "@/components/StatCard";
import { Users, BedDouble, Brain, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { usePatients, useAIAlerts, useAppointments } from "@/hooks/useHospitalData";
import { useHospital } from "@/hooks/useHospital";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, isToday } from "date-fns";

const COLORS = ["hsl(220, 70%, 50%)", "hsl(220, 14%, 90%)"];

const severityDot: Record<string, string> = {
  critical: "bg-critical",
  high: "bg-critical",
  medium: "bg-warning",
  low: "bg-info",
};

export default function Dashboard() {
  const { hospitalId, hospitalName } = useHospital();
  const { data: patients = [] } = usePatients();
  const { data: alerts = [] } = useAIAlerts();
  const { data: appointments = [] } = useAppointments();

  // Fetch real admissions for the last 7 days
  const { data: admissions = [] } = useQuery({
    queryKey: ["dashboard-admissions", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("admissions")
        .select("admission_date, status, actual_discharge_date")
        .eq("hospital_id", hospitalId!)
        .gte("admission_date", sevenDaysAgo);
      return data || [];
    },
  });

  // Fetch real bed data
  const { data: beds = [] } = useQuery({
    queryKey: ["dashboard-beds", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase
        .from("beds")
        .select("is_available, ward_id")
        .eq("hospital_id", hospitalId!)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Fetch doctors by department for department load
  const { data: doctors = [] } = useQuery({
    queryKey: ["dashboard-doctors", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase
        .from("doctors")
        .select("department")
        .eq("hospital_id", hospitalId!);
      return data || [];
    },
  });

  // Build admission trend (last 7 days)
  const admissionData = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const dayStr = format(day, "yyyy-MM-dd");
    const dayAdmissions = admissions.filter(
      (a) => format(new Date(a.admission_date), "yyyy-MM-dd") === dayStr
    ).length;
    const dayDischarges = admissions.filter(
      (a) => a.actual_discharge_date && format(new Date(a.actual_discharge_date), "yyyy-MM-dd") === dayStr
    ).length;
    return { name: format(day, "EEE"), admissions: dayAdmissions, discharges: dayDischarges };
  });

  // Build department load from doctors
  const deptMap = doctors.reduce((acc, d) => {
    const dept = d.department || "General";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const departmentLoad = Object.entries(deptMap)
    .map(([name, count]) => ({ name, patients: count }))
    .sort((a, b) => b.patients - a.patients)
    .slice(0, 8);

  // Real bed occupancy
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => !b.is_available).length;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const bedData = [
    { name: "Occupied", value: occupancyPct },
    { name: "Available", value: 100 - occupancyPct },
  ];

  const inpatients = patients.filter(p => ["inpatient", "icu"].includes(p.status || ""));
  const criticalAlerts = alerts.filter((a: any) => a.severity === "critical" || a.severity === "high");
  const todayAppointments = appointments.filter((a: any) => isToday(new Date(a.appointment_date)));

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Hospital Command Center</h1>
          <p className="text-sm text-muted-foreground">Real-time overview · {hospitalName || "Your Hospital"}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live · Updated just now
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients.length} change={`${inpatients.length} admitted`} changeType="neutral" icon={Users} subtitle="Active records" />
        <StatCard title="Bed Occupancy" value={totalBeds > 0 ? `${occupancyPct}%` : "—"} change={`${totalBeds - occupiedBeds} beds available`} changeType="neutral" icon={BedDouble} subtitle={`${totalBeds} total beds`} />
        <StatCard title="Appointments Today" value={todayAppointments.length} change="View schedule" changeType="neutral" icon={Clock} subtitle="All departments" />
        <StatCard title="AI Alerts" value={alerts.length} change={`${criticalAlerts.length} critical`} changeType={criticalAlerts.length > 0 ? "negative" : "neutral"} icon={Brain} subtitle="Requires attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Admissions vs Discharges (7 days)</h3>
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
          {totalBeds > 0 ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              No beds configured yet
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Staff by Department</h3>
          {departmentLoad.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departmentLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="patients" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Doctors" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              No department data available
            </div>
          )}
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
