import { useState } from "react";
import { Sparkles, Send, AlertTriangle, Clock, User, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TriageResult {
  riskLevel: "low" | "medium" | "critical";
  score: number;
  recommendation: string;
  suggestedDoctor: string;
  estimatedWait: string;
  department: string;
}

const queuePatients = [
  { name: "Amara Jibril", symptoms: "Chest pain, shortness of breath", risk: "critical", wait: "0 min", position: 1 },
  { name: "Olu Adeyemi", symptoms: "Severe abdominal pain, vomiting", risk: "critical", wait: "3 min", position: 2 },
  { name: "Blessing Obi", symptoms: "High fever, cough, body aches", risk: "medium", wait: "12 min", position: 3 },
  { name: "Samuel Mensah", symptoms: "Laceration on forearm", risk: "medium", wait: "18 min", position: 4 },
  { name: "Aisha Mohammed", symptoms: "Mild headache, dizziness", risk: "low", wait: "35 min", position: 5 },
  { name: "Peter Okonkwo", symptoms: "Follow-up wound check", risk: "low", wait: "42 min", position: 6 },
];

const riskStyles = {
  critical: "bg-critical/10 text-critical border-critical/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export default function SmartTriage() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleTriage = () => {
    if (!symptoms.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        riskLevel: symptoms.toLowerCase().includes("chest") || symptoms.toLowerCase().includes("breath") ? "critical" : symptoms.toLowerCase().includes("fever") ? "medium" : "low",
        score: symptoms.toLowerCase().includes("chest") ? 89 : symptoms.toLowerCase().includes("fever") ? 54 : 22,
        recommendation: symptoms.toLowerCase().includes("chest") ? "Immediate cardiac assessment required. ECG and troponin levels recommended." : "Standard consultation. Monitor vitals.",
        suggestedDoctor: "Dr. Chioma Nwosu — Cardiology",
        estimatedWait: symptoms.toLowerCase().includes("chest") ? "Immediate" : "25 min",
        department: symptoms.toLowerCase().includes("chest") ? "Emergency" : "General",
      });
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Smart Triage</h1>
        <p className="text-sm text-muted-foreground">AI-powered symptom assessment & queue prioritization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Input */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Symptom Assessment
            </h3>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe patient symptoms... e.g., 'Patient presents with chest pain radiating to left arm, shortness of breath, sweating'"
              className="w-full h-32 bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button
              onClick={handleTriage}
              disabled={analyzing || !symptoms.trim()}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Run AI Triage
                </>
              )}
            </button>
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`glass-card p-5 border-l-4 ${
                  result.riskLevel === "critical" ? "border-l-critical" :
                  result.riskLevel === "medium" ? "border-l-warning" : "border-l-success"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Triage Result</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${riskStyles[result.riskLevel]}`}>
                    {result.riskLevel} risk
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Risk Score:</span>
                    <span className="text-sm font-semibold text-foreground">{result.score}/100</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{result.recommendation}</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Suggested:</span>
                    <span className="text-xs font-medium text-primary">{result.suggestedDoctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Wait:</span>
                    <span className="text-xs font-medium text-foreground">{result.estimatedWait}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Queue */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Live ER Queue</h3>
          <div className="space-y-2">
            {queuePatients.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <span className="text-xs font-mono text-muted-foreground w-4">#{p.position}</span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  p.risk === "critical" ? "bg-critical animate-pulse" :
                  p.risk === "medium" ? "bg-warning" : "bg-success"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.symptoms}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${riskStyles[p.risk as keyof typeof riskStyles]}`}>
                    {p.risk}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.wait}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
