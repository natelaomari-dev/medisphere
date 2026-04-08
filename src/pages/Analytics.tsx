import { useHospital } from "@/hooks/useHospital";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Calendar, BedDouble, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Analytics() {
  const { hospitalId } = useHospital();

  const { data: patients } = useQuery({
    queryKey: ["analytics-patients", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("created_at, gender, status").eq("hospital_id", hospitalId!);
      return data || [];
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["analytics-appointments", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("appointment_date, status").eq("hospital_id", hospitalId!);
      return data || [];
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["analytics-invoices", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("amount, status, issue_date").eq("hospital_id", hospitalId!);
      return data || [];
    },
  });

  const { data: beds } = useQuery({
    queryKey: ["analytics-beds", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("beds").select("is_available").eq("hospital_id", hospitalId!).eq("is_active", true);
      return data || [];
    },
  });

  // Compute metrics
  const totalPatients = patients?.length || 0;
  const totalAppointments = appointments?.length || 0;
  const totalRevenue = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0) || 0;
  const totalBeds = beds?.length || 0;
  const occupiedBeds = beds?.filter(b => !b.is_available).length || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Patient registration trend (last 14 days)
  const patientTrend = Array.from({ length: 14 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 13 - i));
    const label = format(day, "MMM d");
    const count = patients?.filter(p => format(new Date(p.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length || 0;
    return { day: label, count };
  });

  // Gender distribution
  const genderData = ["Male", "Female", "Other"].map(g => ({
    name: g,
    value: patients?.filter(p => p.gender?.toLowerCase() === g.toLowerCase()).length || 0,
  })).filter(g => g.value > 0);

  // Appointment status breakdown
  const apptStatusData = ["scheduled", "completed", "cancelled", "no_show"].map(s => ({
    name: s.replace("_", " "),
    value: appointments?.filter(a => a.status === s).length || 0,
  })).filter(d => d.value > 0);

  // Revenue by month (last 6 months)
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = format(d, "MMM");
    const ym = format(d, "yyyy-MM");
    const total = invoices?.filter(inv => inv.status === "paid" && inv.issue_date?.startsWith(ym)).reduce((s, inv) => s + Number(inv.amount), 0) || 0;
    return { month, revenue: total };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Hospital performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Patients</p><p className="text-xl font-bold text-foreground">{totalPatients}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-chart-2" /></div>
          <div><p className="text-xs text-muted-foreground">Appointments</p><p className="text-xl font-bold text-foreground">{totalAppointments}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-chart-3" /></div>
          <div><p className="text-xs text-muted-foreground">Revenue (KES)</p><p className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center"><BedDouble className="h-5 w-5 text-chart-4" /></div>
          <div><p className="text-xs text-muted-foreground">Bed Occupancy</p><p className="text-xl font-bold text-foreground">{occupancyRate}%</p></div>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Patient Registrations (14 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={patientTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue Trend (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Appointment Status</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={apptStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {apptStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
