import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

export function useServicePoints() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["service_points", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("service_points").select("*").eq("hospital_id", hospitalId).order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddServicePoint() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (s: any) => {
      const { error } = await sb.from("service_points").insert({ ...s, hospital_id: hospitalId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_points"] }),
  });
}

export function useQueue() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();

  useEffect(() => {
    if (!hospitalId) return;
    const ch = supabase.channel(`queue-${hospitalId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_queue" }, () => {
        qc.invalidateQueries({ queryKey: ["patient_queue", hospitalId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hospitalId, qc]);

  return useQuery({
    queryKey: ["patient_queue", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("patient_queue")
        .select("*, patients(first_name,last_name,patient_id), service_points(name,type)")
        .eq("hospital_id", hospitalId)
        .gte("queued_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("priority", { ascending: false }).order("queued_at");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useEnqueue() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async ({ patient_id, service_point_id, priority }: { patient_id: string; service_point_id: string; priority?: number }) => {
      // generate ticket
      const { data: existing } = await sb.from("patient_queue").select("ticket_number").eq("service_point_id", service_point_id).gte("queued_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
      const { data: sp } = await sb.from("service_points").select("type").eq("id", service_point_id).single();
      const prefix = (sp?.type || "Q").substring(0, 1).toUpperCase();
      const num = ((existing?.length || 0) + 1).toString().padStart(3, "0");
      const ticket_number = `${prefix}-${num}`;
      const { error } = await sb.from("patient_queue").insert({
        patient_id, service_point_id, hospital_id: hospitalId, ticket_number, priority: priority || 0,
      });
      if (error) throw error;
      return ticket_number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient_queue"] }),
  });
}

export function useUpdateQueueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const patch: any = { status, attendant_id: u.user?.id };
      const now = new Date().toISOString();
      if (status === "called") patch.called_at = now;
      if (status === "in_service") patch.served_at = now;
      if (status === "completed" || status === "no_show") patch.completed_at = now;
      const { error } = await sb.from("patient_queue").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient_queue"] }),
  });
}
