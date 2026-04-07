import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMedicalRecords(patientId?: string) {
  return useQuery({
    queryKey: ["medical_records", patientId],
    queryFn: async () => {
      let query = supabase
        .from("medical_records")
        .select("*, patients(first_name, last_name, patient_id), doctors(full_name, specialization)")
        .order("created_at", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      patient_id: string;
      doctor_id?: string;
      hospital_id?: string;
      visit_type: string;
      chief_complaint?: string;
      history_of_present_illness?: string;
      physical_examination?: string;
      assessment?: string;
      treatment_plan?: string;
    }) => {
      const { data, error } = await supabase.from("medical_records").insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medical_records"] }),
  });
}

export function useUpdateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("medical_records").update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medical_records"] }),
  });
}

export function useDiagnoses(medicalRecordId?: string) {
  return useQuery({
    queryKey: ["diagnoses", medicalRecordId],
    queryFn: async () => {
      let query = supabase.from("diagnoses").select("*").order("created_at", { ascending: true });
      if (medicalRecordId) query = query.eq("medical_record_id", medicalRecordId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!medicalRecordId,
  });
}

export function useAddDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (diagnosis: {
      medical_record_id: string;
      hospital_id?: string;
      icd_code: string;
      icd_description: string;
      diagnosis_type: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.from("diagnoses").insert(diagnosis).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diagnoses"] }),
  });
}

export function useVitals(patientId?: string) {
  return useQuery({
    queryKey: ["vitals", patientId],
    queryFn: async () => {
      let query = supabase.from("vitals").select("*").order("created_at", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useRecordVitals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vitals: {
      patient_id: string;
      medical_record_id?: string;
      hospital_id?: string;
      blood_pressure_systolic?: number;
      blood_pressure_diastolic?: number;
      heart_rate?: number;
      temperature?: number;
      respiratory_rate?: number;
      spo2?: number;
      weight?: number;
      height?: number;
      pain_level?: number;
      notes?: string;
    }) => {
      const bmi = vitals.weight && vitals.height ? +(vitals.weight / ((vitals.height / 100) ** 2)).toFixed(1) : undefined;
      const { data, error } = await supabase.from("vitals").insert({ ...vitals, bmi }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vitals"] }),
  });
}
