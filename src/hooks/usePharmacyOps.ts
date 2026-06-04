import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

const sb = supabase as any;

// -------- Stock view --------
export function useMedicationStock() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["medication_stock", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await sb.from("medication_stock").select("*").eq("hospital_id", hospitalId);
      if (error) throw error;
      return data || [];
    },
  });
}

// -------- Batches --------
export function useMedicationBatches(medicationId?: string) {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["medication_batches", hospitalId, medicationId],
    enabled: !!hospitalId,
    queryFn: async () => {
      let q = sb.from("medication_batches").select("*, medications(name, strength, dosage_form)").eq("hospital_id", hospitalId)
        .order("expiry_date", { ascending: true });
      if (medicationId) q = q.eq("medication_id", medicationId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddBatch() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (b: any) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...b,
        hospital_id: hospitalId,
        received_by: u.user?.id,
        quantity_remaining: b.quantity_received,
      };
      const { data, error } = await sb.from("medication_batches").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medication_batches"] });
      qc.invalidateQueries({ queryKey: ["medication_stock"] });
    },
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await sb.from("medication_batches").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medication_batches"] });
      qc.invalidateQueries({ queryKey: ["medication_stock"] });
    },
  });
}

// -------- FEFO dispense --------
export function useDispense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ prescription_id, quantity, counseling }: { prescription_id: string; quantity: number; counseling?: string }) => {
      const { data, error } = await sb.rpc("dispense_medication", {
        _prescription_id: prescription_id, _quantity: quantity, _counseling: counseling || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["medication_batches"] });
      qc.invalidateQueries({ queryKey: ["medication_stock"] });
    },
  });
}

// -------- Dispense history --------
export function useDispenseHistory(prescriptionId?: string) {
  return useQuery({
    queryKey: ["dispenses", prescriptionId],
    enabled: !!prescriptionId,
    queryFn: async () => {
      const { data, error } = await sb.from("medication_dispenses")
        .select("*, medication_batches(batch_number, expiry_date)")
        .eq("prescription_id", prescriptionId).order("dispensed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// -------- Drug safety --------
export function useDrugSafetyCheck() {
  return useMutation({
    mutationFn: async ({ patient_id, medication_id }: { patient_id: string; medication_id: string }) => {
      // Get new med codes
      const { data: newMed } = await sb.from("medications").select("id, name, atc_code, substance, drug_class").eq("id", medication_id).single();

      // Active prescriptions => their meds' atc codes
      const { data: activeRx } = await sb.from("prescriptions").select("medication_id, status, medications(id, name, atc_code, substance, drug_class)").eq("patient_id", patient_id).neq("status", "cancelled");
      const otherMeds = (activeRx || []).map((r: any) => r.medications).filter((m: any) => m && m.id !== medication_id);

      // Interactions
      const interactions: any[] = [];
      if (newMed?.atc_code) {
        const codes = otherMeds.map((m: any) => m.atc_code).filter(Boolean);
        if (codes.length) {
          const { data: intA } = await sb.from("drug_interactions").select("*").eq("drug_a_code", newMed.atc_code).in("drug_b_code", codes);
          const { data: intB } = await sb.from("drug_interactions").select("*").eq("drug_b_code", newMed.atc_code).in("drug_a_code", codes);
          interactions.push(...(intA || []), ...(intB || []));
        }
      }

      // Allergies
      const { data: allergies } = await sb.from("patient_allergies").select("*").eq("patient_id", patient_id).eq("status", "active");
      const allergyHits = (allergies || []).filter((a: any) => {
        const s = (a.substance || "").toLowerCase();
        return newMed?.name?.toLowerCase().includes(s) ||
          newMed?.substance?.toLowerCase().includes(s) ||
          newMed?.drug_class?.toLowerCase().includes(s) ||
          (a.substance_code && newMed?.atc_code === a.substance_code);
      });

      return { interactions, allergyHits, newMed };
    },
  });
}

export function useRecordOverride() {
  return useMutation({
    mutationFn: async (o: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("prescription_overrides").insert({ ...o, acknowledged_by: u.user?.id });
      if (error) throw error;
    },
  });
}
