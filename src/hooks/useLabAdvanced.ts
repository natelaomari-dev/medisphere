import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

export function useLabPanels() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["lab_panels", hospitalId],
    queryFn: async () => {
      const { data, error } = await sb.from("lab_panels").select("*")
        .or(`is_global.eq.true,hospital_id.eq.${hospitalId}`)
        .order("panel_name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLabSpecimens(labOrderId?: string) {
  return useQuery({
    queryKey: ["lab_specimens", labOrderId],
    enabled: !!labOrderId,
    queryFn: async () => {
      const { data, error } = await sb.from("lab_specimens").select("*").eq("lab_order_id", labOrderId)
        .order("collection_datetime", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddSpecimen() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (s: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("lab_specimens").insert({ ...s, hospital_id: hospitalId, collected_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["lab_specimens", v.lab_order_id] }),
  });
}

export function useLabResults(labOrderId?: string) {
  return useQuery({
    queryKey: ["lab_results", labOrderId],
    enabled: !!labOrderId,
    queryFn: async () => {
      const { data, error } = await sb.from("lab_results").select("*").eq("lab_order_id", labOrderId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddLabResult() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (r: any) => {
      // auto-flag based on ranges
      const value = r.result_numeric;
      let flag = r.flag;
      if (!flag && typeof value === "number") {
        const lo = r.reference_range_low, hi = r.reference_range_high;
        if (typeof lo === "number" && value < lo) flag = value < lo * 0.7 ? "critical_low" : "low";
        else if (typeof hi === "number" && value > hi) flag = value > hi * 1.5 ? "critical_high" : "high";
        else flag = "normal";
      }
      const { error } = await sb.from("lab_results").insert({ ...r, hospital_id: hospitalId, flag });
      if (error) throw error;
    },
    onSuccess: (_, v: any) => {
      qc.invalidateQueries({ queryKey: ["lab_results", v.lab_order_id] });
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
    },
  });
}

export function useVerifyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("lab_results").update({ verified_by: u.user?.id, verified_at: new Date().toISOString(), result_status: "final" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_results"] }),
  });
}
