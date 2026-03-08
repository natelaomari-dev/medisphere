import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HeartPulse, Thermometer, Wind, Activity, Brain, AlertTriangle, BedDouble, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

function useICUBeds() {
  return useQuery({
    queryKey: ["icu_beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("icu_beds")
        .select("*, patients(first_name, last_name, patient_id, risk_level), doctors(full_name)")
        .order("bed_number");
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // refresh every 15s for near-realtime
  });
}

function useUpdateVitals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vitals }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("icu_beds")
        .update({ ...vitals, last_vitals_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["icu_beds"] }),
  });
}

function getRiskLevel(score: number | null): { label: string; color: string } {
  if (!score) return { label: "N/A", color: "bg-muted text-muted-foreground" };
  if (score >= 8) return { label: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20" };
  if (score >= 5) return { label: "High", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  if (score >= 3) return { label: "Moderate", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" };
  return { label: "Stable", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
}

function VitalIndicator({ icon: Icon, label, value, unit, warning }: {
  icon: any; label: string; value: number | null; unit: string; warning?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs ${warning ? "text-destructive" : "text-muted-foreground"}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{label}:</span>
      <span className={warning ? "font-bold" : ""}>{value ?? "—"} {value != null ? unit : ""}</span>
    </div>
  );
}

function ICUBedCard({ bed, onEdit }: { bed: any; onEdit: () => void }) {
  const patient = bed.patients as any;
  const doctor = bed.doctors as any;
  const risk = getRiskLevel(bed.risk_score);
  const isOccupied = bed.is_occupied;

  const hrWarning = bed.heart_rate && (bed.heart_rate > 120 || bed.heart_rate < 50);
  const spo2Warning = bed.spo2 && bed.spo2 < 92;
  const tempWarning = bed.temperature && (bed.temperature > 38.5 || bed.temperature < 35);
  const hasAlert = hrWarning || spo2Warning || tempWarning;

  return (
    <Card className={`relative transition-all ${hasAlert ? "border-destructive/40 shadow-destructive/10 shadow-md" : ""} ${!isOccupied ? "opacity-60" : ""}`}>
      {hasAlert && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">{bed.bed_number}</CardTitle>
          <div className="flex items-center gap-1.5">
            {bed.ventilator && <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600 border-violet-500/20">VENT</Badge>}
            {bed.isolation && <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">ISO</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {isOccupied && patient ? (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">{patient.first_name} {patient.last_name}</p>
              <p className="text-xs text-muted-foreground">{patient.patient_id} · Dr. {doctor?.full_name ?? "Unassigned"}</p>
            </div>
            <Badge variant="outline" className={risk.color}>
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Risk: {risk.label} {bed.risk_score != null ? `(${bed.risk_score})` : ""}
              </span>
            </Badge>
            <div className="grid gap-1.5">
              <VitalIndicator icon={HeartPulse} label="HR" value={bed.heart_rate} unit="bpm" warning={hrWarning} />
              <VitalIndicator icon={Activity} label="BP" value={bed.blood_pressure_systolic} unit={bed.blood_pressure_diastolic ? `/${bed.blood_pressure_diastolic} mmHg` : "mmHg"} />
              <VitalIndicator icon={Wind} label="SpO₂" value={bed.spo2} unit="%" warning={spo2Warning} />
              <VitalIndicator icon={Thermometer} label="Temp" value={bed.temperature} unit="°C" warning={tempWarning} />
              <VitalIndicator icon={Wind} label="RR" value={bed.respiratory_rate} unit="/min" />
              <VitalIndicator icon={Brain} label="GCS" value={bed.gcs_score} unit="/15" />
            </div>
            {bed.last_vitals_at && (
              <p className="text-[10px] text-muted-foreground">
                Updated {new Date(bed.last_vitals_at).toLocaleTimeString()}
              </p>
            )}
          </>
        ) : (
          <div className="py-4 text-center">
            <BedDouble className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Vacant</p>
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onEdit}>
          {isOccupied ? "Update Vitals" : "Admit Patient"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ICUMonitoring() {
  const { data: beds, isLoading } = useICUBeds();
  const updateVitals = useUpdateVitals();
  const [editBed, setEditBed] = useState<any>(null);
  const [vitalsForm, setVitalsForm] = useState({
    heart_rate: "", blood_pressure_systolic: "", blood_pressure_diastolic: "",
    spo2: "", temperature: "", respiratory_rate: "", gcs_score: "", risk_score: "",
    ventilator: false, isolation: false,
  });

  useEffect(() => {
    if (editBed) {
      setVitalsForm({
        heart_rate: editBed.heart_rate?.toString() ?? "",
        blood_pressure_systolic: editBed.blood_pressure_systolic?.toString() ?? "",
        blood_pressure_diastolic: editBed.blood_pressure_diastolic?.toString() ?? "",
        spo2: editBed.spo2?.toString() ?? "",
        temperature: editBed.temperature?.toString() ?? "",
        respiratory_rate: editBed.respiratory_rate?.toString() ?? "",
        gcs_score: editBed.gcs_score?.toString() ?? "",
        risk_score: editBed.risk_score?.toString() ?? "",
        ventilator: editBed.ventilator ?? false,
        isolation: editBed.isolation ?? false,
      });
    }
  }, [editBed]);

  const handleSave = async () => {
    if (!editBed) return;
    const numOrNull = (v: string) => v ? Number(v) : null;
    try {
      await updateVitals.mutateAsync({
        id: editBed.id,
        heart_rate: numOrNull(vitalsForm.heart_rate),
        blood_pressure_systolic: numOrNull(vitalsForm.blood_pressure_systolic),
        blood_pressure_diastolic: numOrNull(vitalsForm.blood_pressure_diastolic),
        spo2: numOrNull(vitalsForm.spo2),
        temperature: numOrNull(vitalsForm.temperature),
        respiratory_rate: numOrNull(vitalsForm.respiratory_rate),
        gcs_score: numOrNull(vitalsForm.gcs_score),
        risk_score: numOrNull(vitalsForm.risk_score),
        ventilator: vitalsForm.ventilator,
        isolation: vitalsForm.isolation,
      });
      toast.success("Vitals updated");
      setEditBed(null);
    } catch {
      toast.error("Failed to update vitals");
    }
  };

  const occupied = beds?.filter((b) => b.is_occupied).length ?? 0;
  const critical = beds?.filter((b) => (b.risk_score ?? 0) >= 8).length ?? 0;
  const onVent = beds?.filter((b) => b.ventilator).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">ICU Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Real-time bed status · Auto-refreshes every 15 seconds
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{beds?.length ?? 0}</p><p className="text-xs text-muted-foreground">Total Beds</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{occupied}</p><p className="text-xs text-muted-foreground">Occupied</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{critical}</p><p className="text-xs text-muted-foreground">Critical</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{onVent}</p><p className="text-xs text-muted-foreground">On Ventilator</p></CardContent></Card>
      </div>

      {/* Bed Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading ICU beds...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {beds?.map((bed) => (
            <ICUBedCard key={bed.id} bed={bed} onEdit={() => setEditBed(bed)} />
          ))}
        </div>
      )}

      {/* Edit Vitals Dialog */}
      <Dialog open={!!editBed} onOpenChange={(open) => !open && setEditBed(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update {editBed?.bed_number} Vitals</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Heart Rate (bpm)</Label><Input type="number" value={vitalsForm.heart_rate} onChange={(e) => setVitalsForm((p) => ({ ...p, heart_rate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>SpO₂ (%)</Label><Input type="number" value={vitalsForm.spo2} onChange={(e) => setVitalsForm((p) => ({ ...p, spo2: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>BP Systolic</Label><Input type="number" value={vitalsForm.blood_pressure_systolic} onChange={(e) => setVitalsForm((p) => ({ ...p, blood_pressure_systolic: e.target.value }))} /></div>
              <div className="space-y-1"><Label>BP Diastolic</Label><Input type="number" value={vitalsForm.blood_pressure_diastolic} onChange={(e) => setVitalsForm((p) => ({ ...p, blood_pressure_diastolic: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Temp (°C)</Label><Input type="number" step="0.1" value={vitalsForm.temperature} onChange={(e) => setVitalsForm((p) => ({ ...p, temperature: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Resp Rate (/min)</Label><Input type="number" value={vitalsForm.respiratory_rate} onChange={(e) => setVitalsForm((p) => ({ ...p, respiratory_rate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>GCS Score (/15)</Label><Input type="number" value={vitalsForm.gcs_score} onChange={(e) => setVitalsForm((p) => ({ ...p, gcs_score: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Risk Score (0-10)</Label><Input type="number" step="0.1" value={vitalsForm.risk_score} onChange={(e) => setVitalsForm((p) => ({ ...p, risk_score: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={vitalsForm.ventilator} onCheckedChange={(v) => setVitalsForm((p) => ({ ...p, ventilator: v }))} />
                <Label>Ventilator</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={vitalsForm.isolation} onCheckedChange={(v) => setVitalsForm((p) => ({ ...p, isolation: v }))} />
                <Label>Isolation</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={updateVitals.isPending} className="w-full mt-2">
              {updateVitals.isPending ? "Saving..." : "Save Vitals"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
