import { Brain, TrendingUp, AlertTriangle, Activity, Zap, Heart, Shield, Eye, Package, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useAIAlerts, useAppointments } from "@/hooks/useHospitalData";
import { useHospital } from "@/hooks/useHospital";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isToday, isTomorrow, format } from "date-fns";

const severityStyles: Record<string, string> = {
  critical: "border-l-critical bg-critical/5",
  high: "border-l-critical bg-critical/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-info bg-info/5",
};

const severityIcon: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Activity,
  low: Eye,
};

export default function AIInsights() {
  const { hospitalId } = useHospital();
  const { data: alerts = [], isLoading: alertsLoading } = useAIAlerts();
  const { data: appointments = [] } = useAppointments();

  // Fetch low stock medications
  const { data: lowStockMeds = [] } = useQuery({
    queryKey: ["insights-low-stock", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase
        .from("medications")
        .select("name, stock_quantity, reorder_level")
        .eq("hospital_id", hospitalId!)
        .eq("is_active", true);
      return (data || []).filter(m => m.stock_quantity <= m.reorder_level);
    },
  });

  // Fetch nurse staffing data
  const { data: nurseCount = 0 } = useQuery({
    queryKey: ["insights-nurses", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { count } = await supabase
        .from("hospital_members")
        .select("*", { count: "exact", head: true })
        .eq("hospital_id", hospitalId!)
        .eq("role", "nurse")
        .eq("is_active", true);
      return count || 0;
    },
  });

  // Fetch ICU critical patients
  const { data: icuCritical = 0 } = useQuery({
    queryKey: ["insights-icu", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase
        .from("icu_beds")
        .select("risk_score")
        .eq("is_occupied", true);
      return (data || []).filter(b => (b.risk_score ?? 0) >= 8).length;
    },
  });

  // Compute dynamic hospital insights
  const todayAppts = appointments.filter((a: any) => isToday(new Date(a.appointment_date)));
  const tomorrowAppts = appointments.filter((a: any) => isTomorrow(new Date(a.appointment_date)));

  const hospitalInsights = [
    {
      label: "Today's appointments",
      value: `${todayAppts.length} scheduled`,
      icon: Calendar,
      detail: tomorrowAppts.length > 0
        ? `Tomorrow: ${tomorrowAppts.length} appointments`
        : "No appointments scheduled for tomorrow",
    },
    {
      label: "Low stock medications",
      value: lowStockMeds.length > 0 ? `${lowStockMeds.length} items low` : "Stock levels OK",
      icon: Package,
      detail: lowStockMeds.length > 0
        ? `Reorder needed: ${lowStockMeds.slice(0, 3).map(m => m.name).join(", ")}${lowStockMeds.length > 3 ? ` +${lowStockMeds.length - 3} more` : ""}`
        : "All medications are above reorder levels",
    },
    {
      label: "ICU critical patients",
      value: icuCritical > 0 ? `${icuCritical} critical` : "All stable",
      icon: Heart,
      detail: icuCritical > 0
        ? `${icuCritical} patient(s) with risk score ≥ 8 require close monitoring`
        : "No ICU patients in critical condition",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground">Hospital Intelligence Engine · Powered by MediSphere AI</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          <Brain className="h-3.5 w-3.5" /> AI Active
        </span>
      </div>

      {/* Hospital-wide Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hospitalInsights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <insight.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{insight.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{insight.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{insight.detail}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Alerts / Predictions */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">AI Alerts & Risk Predictions</h2>
        <div className="space-y-3">
          {alertsLoading ? (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground">Loading AI alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No AI alerts at this time</p>
              <p className="text-xs text-muted-foreground mt-1">The AI engine will generate alerts when it detects patient risks or operational issues</p>
            </div>
          ) : (
            alerts.map((alert: any, i: number) => {
              const Icon = severityIcon[alert.severity] || Activity;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className={`glass-card p-5 border-l-4 ${severityStyles[alert.severity] || severityStyles.medium} cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                        alert.severity === "critical" || alert.severity === "high" ? "text-critical" :
                        alert.severity === "medium" ? "text-warning" : "text-info"
                      }`} />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{alert.title}</h3>
                        {alert.patients && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.patients.first_name} {alert.patients.last_name} ({alert.patients.patient_id})
                          </p>
                        )}
                        <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{alert.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {format(new Date(alert.created_at), "MMM d, yyyy · h:mm a")} · {alert.alert_type}
                        </p>
                      </div>
                    </div>
                    {alert.confidence && (
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-lg font-semibold text-foreground">{alert.confidence}%</div>
                        <p className="text-[10px] text-muted-foreground">confidence</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
