import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

export function useOtRooms() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["ot_rooms", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("ot_rooms").select("*").eq("hospital_id", hospitalId).order("room_number");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddOtRoom() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (r: any) => {
      const { error } = await sb.from("ot_rooms").insert({ ...r, hospital_id: hospitalId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ot_rooms"] }),
  });
}

export function useSurgeries() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["surgeries", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("surgeries")
        .select("*, patients(first_name,last_name,patient_id), surgeon:doctors!surgeries_surgeon_id_fkey(full_name), ot_rooms(room_number), surgical_safety_checklist(*)")
        .eq("hospital_id", hospitalId).order("scheduled_start", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useScheduleSurgery() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (s: any) => {
      const { data, error } = await sb.from("surgeries").insert({ ...s, hospital_id: hospitalId }).select().single();
      if (error) throw error;
      // create empty checklist
      await sb.from("surgical_safety_checklist").insert({ surgery_id: data.id, hospital_id: hospitalId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surgeries"] }),
  });
}

export function useUpdateSurgery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await sb.from("surgeries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surgeries"] }),
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ surgery_id, phase, data }: { surgery_id: string; phase: "sign_in" | "time_out" | "sign_out"; data: any }) => {
      const { data: u } = await supabase.auth.getUser();
      const patch: any = {
        [`${phase}_completed`]: true,
        [`${phase}_by`]: u.user?.id,
        [`${phase}_at`]: new Date().toISOString(),
        [`${phase}_data`]: data,
      };
      const { error } = await sb.from("surgical_safety_checklist").update(patch).eq("surgery_id", surgery_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surgeries"] }),
  });
}
