import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

export function useNotificationQueue(filter?: { status?: string; patient_id?: string }) {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["notification_queue", hospitalId, filter],
    queryFn: async () => {
      let q = supabase.from("notification_queue").select("*").eq("hospital_id", hospitalId!).order("scheduled_for", { ascending: false }).limit(200);
      if (filter?.status) q = q.eq("status", filter.status);
      if (filter?.patient_id) q = q.eq("patient_id", filter.patient_id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!hospitalId,
  });
}

export function useTriggerDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("notifications-send", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification_queue"] }),
  });
}

export function useMessagingConfig() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["messaging_config", hospitalId],
    queryFn: async () => {
      const { data } = await supabase.from("hospital_messaging_config").select("*").eq("hospital_id", hospitalId!).maybeSingle();
      return data;
    },
    enabled: !!hospitalId,
  });
}

export function useSaveMessagingConfig() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (patch: any) => {
      const { data, error } = await supabase.from("hospital_messaging_config")
        .upsert({ hospital_id: hospitalId, ...patch }, { onConflict: "hospital_id" })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging_config"] }),
  });
}
