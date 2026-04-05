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
      const update: Record<string, any> = { claim_status };
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
        // Integrated reporting
        const [patients, admissions, labOrders] = await Promise.all([
          supabase.from("patients").select("id, gender, date_of_birth").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
          supabase.from("admissions").select("id, status").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
          supabase.from("lab_orders").select("id, test_category, status").eq("hospital_id", hospitalId!).gte("created_at", start).lte("created_at", end),
        ]);
        reportData = {
          new_patients: patients.data?.length || 0,
          total_admissions: admissions.data?.length || 0,
          total_discharges: admissions.data?.filter((a: any) => a.status === "discharged").length || 0,
          lab_tests_done: labOrders.data?.filter((l: any) => l.status === "completed").length || 0,
        };
      } else if (params.report_type === "moh_333") {
        // Maternity - placeholder
        reportData = {
          anc_visits: 0,
          deliveries: 0,
          live_births: 0,
          still_births: 0,
          maternal_deaths: 0,
          note: "MCH module not yet implemented - data will populate when available",
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
          report_type: params.report_type,
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
