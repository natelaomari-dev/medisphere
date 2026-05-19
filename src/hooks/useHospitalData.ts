import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type Doctor = Database["public"]["Tables"]["doctors"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AIAlert = Database["public"]["Tables"]["ai_alerts"]["Row"];

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Patient[];
    },
  });
}

/**
 * Fire-and-forget audit log for single-record clinical reads.
 * Invokes the audit-record-access edge function which writes to clinical_audit_log.
 */
export async function logRecordAccess(params: {
  table_name: string;
  record_id?: string;
  patient_id?: string;
  accessed_columns?: string[];
  justification?: string;
}) {
  try {
    await supabase.functions.invoke("audit-record-access", { body: params });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}

export function usePatient(id?: string) {
  return useQuery({
    queryKey: ["patient", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      // KDPA audit log: record this PHI access
      logRecordAccess({ table_name: "patients", record_id: data.id, patient_id: data.id });
      return data as Patient;
    },
  });
}

export function useAddPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patient: PatientInsert) => {
      const { data, error } = await supabase.from("patients").insert(patient as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient_count"] });
    },
  });
}

type DoctorInsert = Database["public"]["Tables"]["doctors"]["Insert"];
type DoctorUpdate = Database["public"]["Tables"]["doctors"]["Update"];

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("full_name");
      if (error) throw error;
      return data as Doctor[];
    },
  });
}

export function useAddDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctor: DoctorInsert) => {
      const { data, error } = await supabase.from("doctors").insert(doctor).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: DoctorUpdate & { id: string }) => {
      const { data, error } = await supabase.from("doctors").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
}

export function useToggleDoctorAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("doctors").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(first_name, last_name, patient_id), doctors(full_name, specialization)")
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAIAlerts() {
  return useQuery({
    queryKey: ["ai_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_alerts")
        .select("*, patients(first_name, last_name, patient_id)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function usePatientCount() {
  return useQuery({
    queryKey: ["patient_count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("patients").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useAITriage() {
  return useMutation({
    mutationFn: async (symptoms: string) => {
      const { data, error } = await supabase.functions.invoke("ai-hospital", {
        body: { type: "triage", data: { symptoms } },
      });
      if (error) throw error;
      return data;
    },
  });
}
