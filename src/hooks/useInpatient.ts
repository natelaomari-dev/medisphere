import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWards() {
  return useQuery({
    queryKey: ["wards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ward: { hospital_id: string; name: string; ward_type: string; floor?: string; total_beds?: number }) => {
      const { data, error } = await supabase.from("wards").insert(ward).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wards"] }),
  });
}

export function useBeds(wardId?: string) {
  return useQuery({
    queryKey: ["beds", wardId],
    queryFn: async () => {
      let query = supabase.from("beds").select("*, wards(name, ward_type)").eq("is_active", true).order("bed_number");
      if (wardId) query = query.eq("ward_id", wardId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bed: { ward_id: string; hospital_id: string; bed_number: string; bed_type?: string }) => {
      const { data, error } = await supabase.from("beds").insert(bed).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beds"] }),
  });
}

export function useAdmissions(status?: string) {
  return useQuery({
    queryKey: ["admissions", status],
    queryFn: async () => {
      let query = supabase
        .from("admissions")
        .select("*, patients(first_name, last_name, patient_id), wards(name, ward_type), beds(bed_number), doctors:admitting_doctor_id(full_name)")
        .order("admission_date", { ascending: false });
      if (status) query = query.eq("status", status as "admitted" | "discharged" | "transferred" | "deceased");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (admission: {
      patient_id: string;
      hospital_id: string;
      bed_id?: string;
      ward_id: string;
      admitting_doctor_id?: string;
      admission_reason: string;
      admission_type?: string;
      expected_discharge_date?: string;
    }) => {
      const { data, error } = await supabase.from("admissions").insert(admission).select().single();
      if (error) throw error;
      // Mark bed as unavailable
      if (admission.bed_id) {
        await supabase.from("beds").update({ is_available: false }).eq("id", admission.bed_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useDischargePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bed_id, discharge_summary, discharge_diagnosis }: {
      id: string;
      bed_id?: string;
      discharge_summary?: string;
      discharge_diagnosis?: string;
    }) => {
      const { data, error } = await supabase
        .from("admissions")
        .update({
          status: "discharged" as any,
          actual_discharge_date: new Date().toISOString(),
          discharge_summary,
          discharge_diagnosis,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      if (bed_id) {
        await supabase.from("beds").update({ is_available: true }).eq("id", bed_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useNurseNotes(admissionId?: string) {
  return useQuery({
    queryKey: ["nurse_notes", admissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nurse_notes")
        .select("*")
        .eq("admission_id", admissionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!admissionId,
  });
}

export function useAddNurseNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: {
      admission_id: string;
      patient_id: string;
      hospital_id: string;
      nurse_id?: string;
      note_type: string;
      content: string;
      shift?: string;
    }) => {
      const { data, error } = await supabase.from("nurse_notes").insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nurse_notes"] }),
  });
}
