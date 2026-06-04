import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

export function useMortuaryIntakes() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["mortuary_intakes", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("mortuary_intakes").select("*, mortuary_releases(*)").eq("hospital_id", hospitalId).order("intake_datetime", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddIntake() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (i: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("mortuary_intakes").insert({ ...i, hospital_id: hospitalId, intake_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mortuary_intakes"] }),
  });
}

export function useReleaseBody() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (r: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("mortuary_releases").insert({ ...r, hospital_id: hospitalId, released_by: u.user?.id });
      if (error) throw error;
      await sb.from("mortuary_intakes").update({ status: "released" }).eq("id", r.mortuary_intake_id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mortuary_intakes"] }),
  });
}
