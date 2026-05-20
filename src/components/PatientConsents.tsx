import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Upload, FileText, Check, X } from "lucide-react";

const CONSENT_TYPES: { key: string; label: string; description: string }[] = [
  { key: "treatment", label: "Treatment", description: "General consent to receive medical treatment" },
  { key: "data_sharing", label: "Data sharing", description: "Share records with referred providers / insurers" },
  { key: "ai_processing", label: "AI processing", description: "Allow AI assistance using this patient's data" },
  { key: "photography", label: "Photography", description: "Clinical photography for records" },
  { key: "research", label: "Research", description: "De-identified data use for research" },
  { key: "marketing", label: "Marketing", description: "Educational/marketing communications" },
];

type Consent = {
  id: string;
  consent_type: string;
  status: string;
  granted_at: string;
  revoked_at: string | null;
  expires_at: string | null;
  document_url: string | null;
  consent_form_version: string | null;
  notes: string | null;
};

export function PatientConsents({ patientId }: { patientId: string }) {
  const { hospitalId } = useHospital();
  const qc = useQueryClient();
  const [openType, setOpenType] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: consents = [], isLoading } = useQuery({
    queryKey: ["patient-consents", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_consents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Consent[];
    },
  });

  const latestByType = (type: string) => consents.find(c => c.consent_type === type);

  const grant = useMutation({
    mutationFn: async ({ type, file }: { type: string; file: File | null }) => {
      if (!hospitalId) throw new Error("No hospital context");
      let document_url: string | null = null;
      if (file) {
        const path = `${hospitalId}/${patientId}/${type}-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("consent-documents").upload(path, file);
        if (upErr) throw upErr;
        document_url = path;
      }
      const { error } = await supabase.from("patient_consents").insert({
        patient_id: patientId,
        hospital_id: hospitalId,
        consent_type: type,
        status: "granted",
        granted_at: new Date().toISOString(),
        document_url,
        consent_form_version: formVersion || null,
        notes: notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consent recorded");
      qc.invalidateQueries({ queryKey: ["patient-consents", patientId] });
      setOpenType(null); setFormVersion(""); setNotes("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to record consent"),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patient_consents")
        .update({ status: "revoked", revoked_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consent revoked");
      qc.invalidateQueries({ queryKey: ["patient-consents", patientId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to revoke"),
  });

  const downloadDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("consent-documents").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not load document");
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-6">Loading consents…</p>;

  return (
    <div className="space-y-3">
      {CONSENT_TYPES.map(({ key, label, description }) => {
        const current = latestByType(key);
        const isGranted = current?.status === "granted";
        return (
          <div key={key} className="p-3 rounded-lg border border-border space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  {current ? (
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        isGranted ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : current.status === "revoked" ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {current.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Not recorded</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                {current && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isGranted ? "Granted" : "Revoked"} {format(new Date((isGranted ? current.granted_at : current.revoked_at) || current.granted_at), "MMM d, yyyy")}
                    {current.consent_form_version && ` · v${current.consent_form_version}`}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {isGranted ? (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                    onClick={() => revoke.mutate(current!.id)} disabled={revoke.isPending}>
                    <X className="h-3 w-3 mr-1" /> Revoke
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs"
                    onClick={() => setOpenType(openType === key ? null : key)}>
                    <Check className="h-3 w-3 mr-1" /> Grant
                  </Button>
                )}
                {current?.document_url && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs"
                    onClick={() => downloadDoc(current.document_url!)}>
                    <FileText className="h-3 w-3 mr-1" /> Form
                  </Button>
                )}
              </div>
            </div>

            {openType === key && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Form version</Label>
                    <Input value={formVersion} onChange={e => setFormVersion(e.target.value)} placeholder="e.g. 2024.1" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Signed form (PDF/image)</Label>
                    <label className="flex items-center gap-1.5 h-8 px-2 rounded-md border border-border cursor-pointer hover:bg-muted text-xs">
                      <Upload className="h-3 w-3" />
                      <span className="truncate">{uploading ? "Uploading…" : "Choose file"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploading(true);
                          await grant.mutateAsync({ type: key, file: f });
                          setUploading(false);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Notes (optional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => grant.mutate({ type: key, file: null })} disabled={grant.isPending}>
                    {grant.isPending ? "Saving…" : "Record consent"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpenType(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
