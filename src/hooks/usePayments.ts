import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, patients(first_name, last_name, patient_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useInitiateMpesa() {
  const queryClient = useQueryClient();
  const { hospitalId } = useHospital();

  return useMutation({
    mutationFn: async (params: {
      phone_number: string;
      amount: number;
      patient_id: string;
      invoice_id?: string;
      account_reference?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          action: "initiate",
          hospital_id: hospitalId,
          ...params,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { hospitalId } = useHospital();

  return useMutation({
    mutationFn: async (params: {
      patient_id: string;
      amount: number;
      payment_method: string;
      invoice_id?: string;
      transaction_reference?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          action: "record_payment",
          hospital_id: hospitalId,
          ...params,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useInsuranceClaims() {
  return useQuery({
    queryKey: ["insurance_claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_claims")
        .select("*, patients(first_name, last_name, patient_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  const { hospitalId } = useHospital();

  return useMutation({
    mutationFn: async (claim: {
      patient_id: string;
      invoice_id?: string;
      sha_member_number: string;
      diagnosis_codes: string[];
      treatment_description: string;
      claim_amount: number;
    }) => {
      const { data, error } = await supabase
        .from("insurance_claims")
        .insert({ ...claim, hospital_id: hospitalId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance_claims"] });
    },
  });
}

export function useUpdateClaimStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, claim_status, approved_amount, rejection_reason }: {
      id: string;
      claim_status: string;
      approved_amount?: number;
      rejection_reason?: string;
    }) => {
      const update: any = { claim_status };
      if (claim_status === "submitted") update.submission_date = new Date().toISOString();
      if (approved_amount !== undefined) update.approved_amount = approved_amount;
      if (rejection_reason) update.rejection_reason = rejection_reason;
      if (["approved", "partially_approved", "rejected", "paid"].includes(claim_status)) {
        update.response_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("insurance_claims")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance_claims"] });
    },
  });
}

export function useMOHReports() {
  return useQuery({
    queryKey: ["moh_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moh_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useGenerateMOHReport() {
  const queryClient = useQueryClient();
  const { hospitalId } = useHospital();

  return useMutation({
    mutationFn: async (params: {
      report_type: string;
      reporting_period_start: string;
      reporting_period_end: string;
    }) => {
      // Generate report data based on type by querying relevant tables
      const start = params.reporting_period_start;
      const end = params.reporting_period_end;

      let reportData: Record<string, any> = {};

      if (params.report_type === "moh_705a" || params.report_type === "moh_705b") {
        // Outpatient morbidity - query diagnoses in period
        const { data: records } = await supabase
          .from("medical_records")
          .select("*, diagnoses(*)")
          .eq("hospital_id", hospitalId!)
          .gte("created_at", start)
          .lte("created_at", end);
        
        const diagnosisCounts: Record<string, number> = {};
        records?.forEach((r: any) => {
          (r.diagnoses || []).forEach((d: any) => {
            const key = `${d.icd_code} - ${d.icd_description}`;
            diagnosisCounts[key] = (diagnosisCounts[key] || 0) + 1;
          });
        });
        reportData = {
          total_visits: records?.length || 0,
          diagnosis_summary: diagnosisCounts,
          new_attendances: records?.filter((r: any) => r.visit_type === "outpatient").length || 0,
          re_attendances: records?.filter((r: any) => r.visit_type === "follow_up").length || 0,
        };
      } else if (params.report_type === "moh_711") {
        // Integrated reporting - pulls from core + HIV/TB/MCH tables
        const [patients, admissions, labOrders, tbCases, hivEnroll, ancVisits, deliveries] = await Promise.all([
          supabase.from("patients").select("id, gender, date_of_birth").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
          supabase.from("admissions").select("id, status").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
          supabase.from("lab_orders").select("id, test_category, status").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
          (supabase as any).from("tb_cases").select("id, outcome, type").eq("hospital_id", hospitalId!).gte("registration_date", start).lte("registration_date", end),
          (supabase as any).from("hiv_enrollments").select("id, who_stage").eq("hospital_id", hospitalId!).gte("enrollment_date", start).lte("enrollment_date", end),
          (supabase as any).from("mch_anc_visits").select("id, visit_number").eq("hospital_id", hospitalId!).gte("visit_date", start).lte("visit_date", end),
          (supabase as any).from("mch_deliveries").select("id, outcome").eq("hospital_id", hospitalId!).gte("delivery_date", start).lte("delivery_date", end),
        ]);
        reportData = {
          new_patients: patients.data?.length || 0,
          total_admissions: admissions.data?.length || 0,
          total_discharges: admissions.data?.filter((a: any) => a.status === "discharged").length || 0,
          lab_tests_done: labOrders.data?.filter((l: any) => l.status === "completed").length || 0,
          tb_new_cases: tbCases.data?.filter((t: any) => t.type === "new").length || 0,
          tb_total_cases: tbCases.data?.length || 0,
          hiv_new_enrollments: hivEnroll.data?.length || 0,
          anc_visits: ancVisits.data?.length || 0,
          anc_first_visits: ancVisits.data?.filter((v: any) => v.visit_number === 1).length || 0,
          deliveries: deliveries.data?.length || 0,
          live_births: deliveries.data?.filter((d: any) => d.outcome === "live_birth").length || 0,
        };
      } else if (params.report_type === "moh_333") {
        // MOH 333 — Maternity Register
        const [anc, deliveries, pnc] = await Promise.all([
          (supabase as any).from("mch_anc_visits").select("id, visit_number, gestational_age_weeks, tt_dose, ifas_given").eq("hospital_id", hospitalId!).gte("visit_date", start).lte("visit_date", end),
          (supabase as any).from("mch_deliveries").select("id, mode, outcome, birth_weight_g, place").eq("hospital_id", hospitalId!).gte("delivery_date", start).lte("delivery_date", end),
          (supabase as any).from("mch_postnatal_visits").select("id, visit_timepoint").eq("hospital_id", hospitalId!).gte("visit_date", start).lte("visit_date", end),
        ]);
        const dels = deliveries.data || [];
        reportData = {
          anc_total_visits: anc.data?.length || 0,
          anc_first_visits: anc.data?.filter((v: any) => v.visit_number === 1).length || 0,
          anc_4plus_visits: anc.data?.filter((v: any) => (v.visit_number || 0) >= 4).length || 0,
          tt_doses_administered: anc.data?.filter((v: any) => v.tt_dose).length || 0,
          ifas_distributed: anc.data?.filter((v: any) => v.ifas_given).length || 0,
          deliveries: dels.length,
          svd: dels.filter((d: any) => d.mode === "svd").length,
          assisted: dels.filter((d: any) => d.mode === "assisted").length,
          c_section: dels.filter((d: any) => d.mode?.startsWith("c_section")).length,
          live_births: dels.filter((d: any) => d.outcome === "live_birth").length,
          still_births: dels.filter((d: any) => d.outcome?.startsWith("still_birth")).length,
          low_birth_weight: dels.filter((d: any) => (d.birth_weight_g || 0) > 0 && (d.birth_weight_g || 0) < 2500).length,
          facility_deliveries: dels.filter((d: any) => d.place === "facility").length,
          pnc_visits: pnc.data?.length || 0,
          pnc_6h: pnc.data?.filter((p: any) => p.visit_timepoint === "6_hour").length || 0,
          pnc_6d: pnc.data?.filter((p: any) => p.visit_timepoint === "6_day").length || 0,
          pnc_6w: pnc.data?.filter((p: any) => p.visit_timepoint === "6_week").length || 0,
        };
      } else if (params.report_type === "moh_731") {
        const [enroll, vl, tb] = await Promise.all([
          (supabase as any).from("hiv_enrollments").select("id, who_stage").eq("hospital_id", hospitalId!).gte("enrollment_date", start).lte("enrollment_date", end),
          (supabase as any).from("viral_load_results").select("id, suppressed").eq("hospital_id", hospitalId!).gte("sample_date", start).lte("sample_date", end),
          (supabase as any).from("tb_cases").select("id, hiv_status").eq("hospital_id", hospitalId!).gte("registration_date", start).lte("registration_date", end),
        ]);
        const vls = vl.data || [];
        reportData = {
          new_hiv_enrollments: enroll.data?.length || 0,
          vl_tests_done: vls.length,
          vl_suppressed: vls.filter((v: any) => v.suppressed).length,
          vl_suppression_pct: vls.length ? Math.round(vls.filter((v: any) => v.suppressed).length / vls.length * 100) : 0,
          tb_hiv_coinfection: tb.data?.filter((t: any) => t.hiv_status?.toLowerCase().includes("pos")).length || 0,
        };
      } else if (params.report_type === "moh_406") {
        // Lab summary
        const { data: labOrders } = await supabase
          .from("lab_orders")
          .select("test_category, test_name, status")
          .eq("hospital_id", hospitalId!)
          .gte("created_at", start)
          .lte("created_at", end);
        
        const categoryCounts: Record<string, number> = {};
        labOrders?.forEach((l: any) => {
          categoryCounts[l.test_category] = (categoryCounts[l.test_category] || 0) + 1;
        });
        reportData = {
          total_tests: labOrders?.length || 0,
          completed_tests: labOrders?.filter((l: any) => l.status === "completed").length || 0,
          tests_by_category: categoryCounts,
        };
      }

      const { data, error } = await supabase
        .from("moh_reports")
        .insert({
          hospital_id: hospitalId!,
          report_type: params.report_type as any,
          reporting_period_start: start,
          reporting_period_end: end,
          report_data: reportData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moh_reports"] });
    },
  });
}
