import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

// ---------- MCH ----------
export function useAncVisits(patientId?: string) {
  return useQuery({
    queryKey: ["anc_visits", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mch_anc_visits").select("*").eq("patient_id", patientId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddAncVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: any) => {
      const { data, error } = await (supabase as any).from("mch_anc_visits").insert(visit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["anc_visits", v.patient_id] }),
  });
}

export function useDeliveries(patientId?: string) {
  return useQuery({
    queryKey: ["deliveries", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mch_deliveries").select("*").eq("patient_id", patientId)
        .order("delivery_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("mch_deliveries").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["deliveries", v.patient_id] }),
  });
}

export function usePnc(patientId?: string) {
  return useQuery({
    queryKey: ["pnc", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mch_postnatal_visits").select("*").eq("patient_id", patientId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddPnc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("mch_postnatal_visits").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["pnc", v.patient_id] }),
  });
}

// ---------- Pediatrics ----------
export function useKepiSchedule() {
  return useQuery({
    queryKey: ["kepi_schedule"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("kepi_schedule").select("*").order("age_weeks");
      if (error) throw error;
      return data || [];
    },
  });
}
export function useChildImmunizations(childId?: string) {
  return useQuery({
    queryKey: ["child_immunizations", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("child_immunizations").select("*").eq("child_patient_id", childId);
      if (error) throw error;
      return data || [];
    },
  });
}
export function useRecordImmunization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("child_immunizations").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["child_immunizations", v.child_patient_id] }),
  });
}
export function useGrowthMonitoring(childId?: string) {
  return useQuery({
    queryKey: ["growth_monitoring", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("growth_monitoring").select("*").eq("child_patient_id", childId)
        .order("visit_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddGrowth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("growth_monitoring").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["growth_monitoring", v.child_patient_id] }),
  });
}

// ---------- HIV ----------
export function useHivEnrollment(patientId?: string) {
  return useQuery({
    queryKey: ["hiv_enroll", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hiv_enrollments").select("*").eq("patient_id", patientId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
export function useAddHivEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("hiv_enrollments").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["hiv_enroll", v.patient_id] }),
  });
}
export function useArtRegimens(patientId?: string) {
  return useQuery({
    queryKey: ["art_regimens", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("art_regimens").select("*").eq("patient_id", patientId).order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddArtRegimen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("art_regimens").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["art_regimens", v.patient_id] }),
  });
}
export function useViralLoads(patientId?: string) {
  return useQuery({
    queryKey: ["vl", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("viral_load_results").select("*").eq("patient_id", patientId).order("sample_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddViralLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("viral_load_results").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["vl", v.patient_id] }),
  });
}
export function useArtDispenses(patientId?: string) {
  return useQuery({
    queryKey: ["art_dispenses", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("art_dispenses").select("*").eq("patient_id", patientId).order("dispense_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddArtDispense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("art_dispenses").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["art_dispenses", v.patient_id] }),
  });
}

// ---------- TB ----------
export function useTbCases() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["tb_cases", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tb_cases").select("*, patients(first_name,last_name,patient_id)").eq("hospital_id", hospitalId)
        .order("registration_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddTbCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("tb_cases").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tb_cases"] }),
  });
}
export function useTbDotVisits(caseId?: string) {
  return useQuery({
    queryKey: ["tb_dot", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tb_dot_visits").select("*").eq("tb_case_id", caseId).order("visit_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddTbDot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("tb_dot_visits").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["tb_dot", v.tb_case_id] }),
  });
}
export function useTbContacts(caseId?: string) {
  return useQuery({
    queryKey: ["tb_contacts", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tb_contacts").select("*").eq("tb_case_id", caseId);
      if (error) throw error;
      return data || [];
    },
  });
}
export function useAddTbContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { data, error } = await (supabase as any).from("tb_contacts").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v: any) => qc.invalidateQueries({ queryKey: ["tb_contacts", v.tb_case_id] }),
  });
}

// ---------- Order Sets ----------
export function useOrderSets() {
  return useQuery({
    queryKey: ["order_sets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("order_sets").select("*, order_set_items(*)").order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useApplyOrderSet() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async ({ order_set_id, medical_record_id, patient_id }: { order_set_id: string; medical_record_id: string; patient_id: string }) => {
      const { data: items, error } = await (supabase as any)
        .from("order_set_items").select("*").eq("order_set_id", order_set_id).order("sequence");
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      let labCount = 0, noteCount = 0;
      const planLines: string[] = [];
      for (const it of items || []) {
        const d = it.item_data || {};
        if (it.item_type === "lab") {
          await (supabase as any).from("lab_orders").insert({
            hospital_id: hospitalId, patient_id, ordered_by: userId,
            test_name: d.test_name || "Order set lab",
            test_category: d.test_category || "general",
            priority: d.priority || "routine",
            notes: d.notes || null,
          });
          labCount++;
        } else {
          const line = [it.item_type.toUpperCase(), d.name || d.text || d.test_name || "", d.dose, d.route, d.frequency].filter(Boolean).join(" — ");
          planLines.push(`• ${line}`);
          noteCount++;
        }
      }
      if (planLines.length) {
        const { data: rec } = await supabase.from("medical_records").select("treatment_plan").eq("id", medical_record_id).single();
        const existing = rec?.treatment_plan || "";
        const appended = (existing ? existing + "\n\n" : "") + `[Order set applied ${new Date().toLocaleDateString()}]\n` + planLines.join("\n");
        await supabase.from("medical_records").update({ treatment_plan: appended }).eq("id", medical_record_id);
      }
      return { labCount, noteCount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
      qc.invalidateQueries({ queryKey: ["medical_records"] });
    },
  });
}
