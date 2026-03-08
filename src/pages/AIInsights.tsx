import { Brain, TrendingUp, AlertTriangle, Activity, Zap, Heart, Shield, Eye } from "lucide-react";
import { motion } from "framer-motion";

const predictions = [
  {
    title: "Sepsis Risk Alert",
    patient: "Kwame Asante (P-1002)",
    confidence: 87,
    severity: "critical",
    description: "Elevated WBC, rising lactate levels, and temperature trend suggest early sepsis. Recommend immediate blood cultures and empirical antibiotics.",
    icon: AlertTriangle,
  },
  {
    title: "ICU Transfer Prediction",
    patient: "Ibrahim Kamara (P-1008)",
    confidence: 72,
    severity: "warning",
    description: "Declining SpO2 and respiratory rate changes indicate possible respiratory failure within 6-12 hours. Consider preemptive ICU transfer.",
    icon: Activity,
  },
  {
    title: "Readmission Risk",
    patient: "Grace Okafor (P-1005)",
    confidence: 65,
    severity: "warning",
    description: "Post-chemotherapy complications pattern detected. 65% probability of readmission within 30 days without enhanced follow-up.",
    icon: TrendingUp,
  },
  {
    title: "Drug Interaction Warning",
    patient: "Fatima Diallo (P-1003)",
    confidence: 94,
    severity: "info",
    description: "Prescribed metformin may interact with newly ordered contrast dye for CT scan. Suggest temporary suspension.",
    icon: Shield,
  },
];

const hospitalInsights = [
  { label: "ER surge predicted", value: "Tomorrow 2-6PM", icon: Zap, detail: "Based on historical patterns and regional event data" },
  { label: "Malaria cases trending up", value: "+34% this week", icon: Eye, detail: "Unusual spike in Lagos region — possible outbreak signal" },
  { label: "Staff optimization", value: "3 nurses needed", icon: Heart, detail: "Night shift Ward B understaffed for current patient load" },
];

const severityStyles = {
  critical: "border-l-critical bg-critical/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-info bg-info/5",
};

export default function AIInsights() {
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

      {/* Patient Predictions */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Patient Risk Predictions</h2>
        <div className="space-y-3">
          {predictions.map((pred, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`glass-card p-5 border-l-4 ${severityStyles[pred.severity as keyof typeof severityStyles]} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <pred.icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                    pred.severity === "critical" ? "text-critical" :
                    pred.severity === "warning" ? "text-warning" : "text-info"
                  }`} />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{pred.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{pred.patient}</p>
                    <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{pred.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-lg font-semibold text-foreground">{pred.confidence}%</div>
                  <p className="text-[10px] text-muted-foreground">confidence</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
