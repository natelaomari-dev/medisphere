import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

export function useDonors() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["blood_donors", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("blood_donors").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddDonor() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (d: any) => {
      const { error } = await sb.from("blood_donors").insert({ ...d, hospital_id: hospitalId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood_donors"] }),
  });
}

export function useBloodUnits() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["blood_units", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("blood_units").select("*, blood_donors(name, donor_number)").eq("hospital_id", hospitalId).order("expiry_date");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddBloodUnit() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (u: any) => {
      const { error } = await sb.from("blood_units").insert({ ...u, hospital_id: hospitalId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood_units"] }),
  });
}

export function useCrossmatches() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["blood_crossmatches", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("blood_crossmatches").select("*, patients(first_name,last_name,patient_id), blood_units(unit_number, component_type, blood_group, rh_factor)").eq("hospital_id", hospitalId).order("crossmatch_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCrossmatch() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (x: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("blood_crossmatches").insert({ ...x, hospital_id: hospitalId, performed_by: u.user?.id });
      if (error) throw error;
      if (x.blood_unit_id && x.result === "compatible") {
        await sb.from("blood_units").update({ status: "reserved" }).eq("id", x.blood_unit_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blood_crossmatches"] });
      qc.invalidateQueries({ queryKey: ["blood_units"] });
    },
  });
}

export function useTransfusions() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["blood_transfusions", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("blood_transfusions").select("*, patients(first_name,last_name), blood_units(unit_number, component_type)").eq("hospital_id", hospitalId).order("started_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddTransfusion() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (t: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("blood_transfusions").insert({ ...t, hospital_id: hospitalId, performed_by: u.user?.id });
      if (error) throw error;
      if (t.blood_unit_id) {
        await sb.from("blood_units").update({ status: "issued" }).eq("id", t.blood_unit_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blood_transfusions"] });
      qc.invalidateQueries({ queryKey: ["blood_units"] });
    },
  });
}
