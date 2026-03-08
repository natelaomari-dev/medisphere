import { useState } from "react";
import { Sparkles, Send, Activity, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAITriage } from "@/hooks/useHospitalData";
import { toast } from "sonner";

interface TriageResult {
  riskLevel: string;
  score: number;
  recommendation: string;
  suggestedDepartment: string;
  estimatedWait: string;
}

const riskStyles: Record<string, string> = {
  critical: "bg-critical/10 text-critical border-critical/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export default function SmartTriage() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const triageMutation = useAITriage();

  const handleTriage = async () => {
    if (!symptoms.trim()) return;
    try {
      const data = await triageMutation.mutateAsync(symptoms);
      // Parse AI response - try JSON first, fallback to structured parsing
      const content = data.result || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult({
            riskLevel: parsed.riskLevel || parsed.risk_level || "medium",
            score: parsed.score || 50,
            recommendation: parsed.recommendation || content,
            suggestedDepartment: parsed.suggestedDepartment || parsed.suggested_department || "General",
            estimatedWait: parsed.estimatedWait || parsed.estimated_wait || "15 min",
          });
        } else {
          setResult({
            riskLevel: "medium",
            score: 50,
            recommendation: content,
            suggestedDepartment: "General",
            estimatedWait: "15 min",
          });
        }
      } catch {
        setResult({
          riskLevel: "medium",
          score: 50,
          recommendation: content,
          suggestedDepartment: "General",
          estimatedWait: "15 min",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "AI triage failed");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Smart Triage</h1>
        <p className="text-sm text-muted-foreground">AI-powered symptom assessment · Powered by MediSphere AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              disabled={triageMutation.isPending || !symptoms.trim()}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {triageMutation.isPending ? (
                <><div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Send className="h-4 w-4" /> Run AI Triage</>
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
                  <h3 className="text-sm font-medium text-foreground">AI Triage Result</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${riskStyles[result.riskLevel] || riskStyles.medium}`}>
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
                    <span className="text-xs text-muted-foreground">Department:</span>
                    <span className="text-xs font-medium text-primary">{result.suggestedDepartment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Est. Wait:</span>
                    <span className="text-xs font-medium text-foreground">{result.estimatedWait}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: "1", title: "Enter Symptoms", desc: "Describe the patient's symptoms in natural language" },
              { step: "2", title: "AI Analysis", desc: "MediSphere AI analyzes symptoms using clinical knowledge" },
              { step: "3", title: "Risk Assessment", desc: "Get risk score, recommended department, and priority" },
              { step: "4", title: "Route Patient", desc: "Direct patient to the appropriate department and doctor" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">{item.step}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
