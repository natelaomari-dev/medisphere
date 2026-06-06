import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { claimAdapters, type ClaimAdapterType, parseShaResponseCSV } from "@/lib/claimAdapters";

// ============ DHIS2 ============
export function useDhis2Mapping() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["dhis2_mapping", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase.from("dhis2_facility_mappings").select("*").eq("hospital_id", hospitalId!).maybeSingle();
      if (error) throw error; return data;
    },
  });
}

export function useUpsertDhis2Mapping() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (vals: { dhis2_org_unit_uid: string; dhis2_endpoint_url: string; dhis2_username?: string; dhis2_instance_name?: string; is_active?: boolean }) => {
      const { data, error } = await supabase.from("dhis2_facility_mappings").upsert({
        hospital_id: hospitalId!, ...vals,
      } as any, { onConflict: "hospital_id" }).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dhis2_mapping"] }),
  });
}

export function useSubmitDhis2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report_id: string) => {
      const { data, error } = await supabase.functions.invoke("dhis2-submit", { body: { report_id } });
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moh_reports"] }),
  });
}

// ============ Webhooks ============
export function useWebhooks() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["outbound_webhooks", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase.from("outbound_webhooks").select("*").eq("hospital_id", hospitalId!).order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (vals: { name: string; target_url: string; event_types: string[]; secret?: string }) => {
      const secret = vals.secret || crypto.randomUUID().replace(/-/g, "");
      const { data, error } = await supabase.from("outbound_webhooks").insert({
        hospital_id: hospitalId!, ...vals, secret,
      } as any).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outbound_webhooks"] }),
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("outbound_webhooks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outbound_webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("outbound_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outbound_webhooks"] }),
  });
}

export async function fireWebhookEvent(event_type: string, hospital_id: string, payload: any) {
  try {
    await supabase.functions.invoke("webhook-dispatcher", { body: { event_type, hospital_id, payload } });
  } catch (e) { console.warn("webhook dispatch failed", e); }
}

// ============ Insurance schemes ============
export function useInsuranceSchemes() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["insurance_schemes", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_schemes").select("*").eq("hospital_id", hospitalId!).order("scheme_name");
      if (error) throw error; return data;
    },
  });
}

export function useUpsertScheme() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (vals: { id?: string; scheme_name: string; adapter_type: ClaimAdapterType; contact_email?: string; contact_phone?: string; is_active?: boolean }) => {
      const { data, error } = await supabase.from("insurance_schemes").upsert({
        hospital_id: hospitalId!, ...vals,
      } as any).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_schemes"] }),
  });
}

// ============ SHA claim batches ============
export function useShaBatches() {
  const { hospitalId } = useHospital();
  return useQuery({
    queryKey: ["sha_batches", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sha_claim_batches").select("*").eq("hospital_id", hospitalId!).order("generated_at", { ascending: false });
      if (error) throw error; return data;
    },
  });
}

export function useGenerateShaBatch() {
  const qc = useQueryClient();
  const { hospitalId } = useHospital();
  return useMutation({
    mutationFn: async (params: { period_start: string; period_end: string; scheme_id?: string; adapter_type?: ClaimAdapterType }) => {
      // Pull claims in range, eligible (draft/submitted not yet batched)
      const { data: claims, error: cerr } = await supabase.from("insurance_claims")
        .select("*, patients(first_name, last_name, family_name, given_names, date_of_birth, gender, insurance_number)")
        .eq("hospital_id", hospitalId!)
        .gte("created_at", params.period_start)
        .lte("created_at", `${params.period_end}T23:59:59`)
        .is("sha_batch_id", null);
      if (cerr) throw cerr;
      const eligible = claims || [];
      const total_amount = eligible.reduce((s, c: any) => s + Number(c.claim_amount || 0), 0);

      const batchNumber = `B-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { data: batch, error: berr } = await supabase.from("sha_claim_batches").insert({
        hospital_id: hospitalId!,
        scheme_id: params.scheme_id || null,
        batch_number: batchNumber,
        period_start: params.period_start,
        period_end: params.period_end,
        total_claims: eligible.length,
        total_amount,
      } as any).select().single();
      if (berr) throw berr;

      if (eligible.length) {
        await supabase.from("insurance_claims").update({ sha_batch_id: batch.id })
          .in("id", eligible.map((c) => c.id));
      }

      // Build CSV via adapter
      const adapter = claimAdapters[params.adapter_type || "sha"];
      const rows = eligible.map((c: any) => {
        const p = c.patients || {};
        const name = [p.given_names?.join(" ") || p.first_name, p.family_name || p.last_name].filter(Boolean).join(" ");
        return {
          claim_number: c.claim_number,
          patient_sha_number: c.sha_member_number || p.insurance_number,
          patient_name: name,
          dob: p.date_of_birth,
          sex: p.gender,
          admission_date: c.created_at?.slice(0, 10),
          discharge_date: c.response_date?.slice(0, 10),
          diagnosis_codes: c.diagnosis_codes || [],
          procedure_codes: [],
          total_charged: Number(c.claim_amount || 0),
          rebate: 0,
          balance_billed: Number(c.claim_amount || 0),
          notes: c.notes,
        };
      });
      const csv = adapter.toCSV(rows);
      return { batch, csv, filename: `${adapter.type}-${batchNumber}.csv` };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sha_batches"] });
      qc.invalidateQueries({ queryKey: ["insurance_claims"] });
    },
  });
}

export function useMarkBatchExported() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sha_claim_batches").update({ submission_status: "exported" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sha_batches"] }),
  });
}

export function useReconcileShaResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ batch_id, csvText, acknowledgement }: { batch_id: string; csvText: string; acknowledgement?: string }) => {
      const rows = parseShaResponseCSV(csvText);
      let approvedTotal = 0;
      for (const r of rows) {
        const claim_status = r.status.startsWith("appr") ? "approved" : (r.status.startsWith("rej") ? "rejected" : (r.status.startsWith("partial") ? "partially_approved" : "submitted"));
        await supabase.from("insurance_claims").update({
          claim_status: claim_status as any,
          approved_amount: r.approved_amount,
          rejection_reason: r.rejection_reason || null,
          response_date: new Date().toISOString(),
        }).eq("sha_batch_id", batch_id).eq("claim_number", r.claim_number);
        approvedTotal += r.approved_amount;
      }
      const { error } = await supabase.from("sha_claim_batches").update({
        submission_status: "reconciled",
        sha_acknowledgement_number: acknowledgement || null,
        approved_amount: approvedTotal,
        reconciled_at: new Date().toISOString(),
      }).eq("id", batch_id);
      if (error) throw error;
      return { reconciled: rows.length, approvedTotal };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sha_batches"] });
      qc.invalidateQueries({ queryKey: ["insurance_claims"] });
    },
  });
}
