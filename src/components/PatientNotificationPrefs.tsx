import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function PatientNotificationPrefs({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ["patient_contacts", patientId],
    queryFn: async () => {
      const { data } = await supabase.from("patient_contacts").select("*").eq("patient_id", patientId).order("is_primary", { ascending: false });
      return data || [];
    },
  });

  const { data: patient } = useQuery({
    queryKey: ["patient_language", patientId],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("preferred_language").eq("id", patientId).maybeSingle();
      return data;
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("patient_contacts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patient_contacts", patientId] }); toast.success("Updated"); },
  });

  const updateLanguage = useMutation({
    mutationFn: async (lng: string) => {
      const { error } = await supabase.from("patients").update({ preferred_language: lng }).eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patient_language", patientId] }); toast.success("Language updated"); },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("patient.notification_preferences")}</CardTitle>
        <CardDescription>Channel opt-ins are per contact. Messages use the patient's preferred language.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 max-w-xs">
          <Label>{t("patient.preferred_language")}</Label>
          <Select value={patient?.preferred_language || "en"} onValueChange={(v) => updateLanguage.mutate(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contact methods on file. Add a phone or email first.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c: any) => (
              <div key={c.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.contact_type.replace(/_/g, " ")}{c.is_primary ? " · primary" : ""}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={c.opt_in_sms} onCheckedChange={(v) => updateContact.mutate({ id: c.id, patch: { opt_in_sms: v } })} />
                    {t("patient.opt_in_sms")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={c.opt_in_whatsapp} onCheckedChange={(v) => updateContact.mutate({ id: c.id, patch: { opt_in_whatsapp: v } })} />
                    {t("patient.opt_in_whatsapp")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={c.opt_in_email} onCheckedChange={(v) => updateContact.mutate({ id: c.id, patch: { opt_in_email: v } })} />
                    {t("patient.opt_in_email")}
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
