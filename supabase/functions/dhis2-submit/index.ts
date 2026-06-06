// DHIS2 ADX dataValueSet submitter
// Reads MOH report, transforms to DHIS2 dataValueSet using mappings, POSTs with retry.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function periodFromDates(start: string, end: string): string {
  // monthly: YYYYMM; quarterly: YYYYQn; yearly: YYYY
  const s = new Date(start), e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const monthsDiff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  if (monthsDiff === 1) return `${s.getFullYear()}${String(s.getMonth() + 1).padStart(2, "0")}`;
  if (monthsDiff === 3 && sameYear) return `${s.getFullYear()}Q${Math.floor(s.getMonth() / 3) + 1}`;
  if (monthsDiff === 12 && sameYear) return `${s.getFullYear()}`;
  return `${s.getFullYear()}${String(s.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchVaultSecret(admin: any, secretId: string): Promise<string | null> {
  const { data } = await admin.from("vault" as any).select("decrypted_secret").eq("id", secretId).maybeSingle().catch(() => ({ data: null }));
  if (data?.decrypted_secret) return data.decrypted_secret;
  // Fallback via decrypted_secrets view
  const { data: d2 } = await admin.schema("vault" as any).from("decrypted_secrets" as any).select("decrypted_secret").eq("id", secretId).maybeSingle().catch(() => ({ data: null }));
  return d2?.decrypted_secret || null;
}

async function postWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw lastErr;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { report_id } = await req.json();
    if (!report_id) return new Response(JSON.stringify({ error: "report_id required" }), { status: 400, headers: corsHeaders });

    const { data: report, error: rerr } = await admin.from("moh_reports").select("*, hospitals(country)").eq("id", report_id).maybeSingle();
    if (rerr || !report) return new Response(JSON.stringify({ error: "Report not found" }), { status: 404, headers: corsHeaders });

    const { data: isMember } = await admin.rpc("is_hospital_member", { _user_id: claims.claims.sub, _hospital_id: report.hospital_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { data: mapping } = await admin.from("dhis2_facility_mappings").select("*").eq("hospital_id", report.hospital_id).maybeSingle();
    if (!mapping || !mapping.is_active) {
      return new Response(JSON.stringify({ error: "No active DHIS2 facility mapping for this hospital" }), { status: 400, headers: corsHeaders });
    }

    const country = (report.hospitals as any)?.country || "KE";
    const { data: elementMappings } = await admin.from("dhis2_data_element_mappings")
      .select("*").eq("country_code", country).eq("report_type", report.report_type);

    if (!elementMappings?.length) {
      return new Response(JSON.stringify({ error: `No element mappings for ${report.report_type} / ${country}` }), { status: 400, headers: corsHeaders });
    }

    // Build dataValueSet
    const dataValues: any[] = [];
    const skipped: string[] = [];
    for (const m of elementMappings) {
      if (m.dhis2_data_element_uid === "PENDING") { skipped.push(m.metric_key); continue; }
      const v = (report.report_data as any)?.[m.metric_key];
      if (v == null) continue;
      dataValues.push({
        dataElement: m.dhis2_data_element_uid,
        categoryOptionCombo: m.dhis2_category_option_combo_uid || undefined,
        value: String(v),
      });
    }

    const period = periodFromDates(report.reporting_period_start, report.reporting_period_end);
    const payload = {
      dataSet: report.report_type,
      completeDate: new Date().toISOString().slice(0, 10),
      period,
      orgUnit: mapping.dhis2_org_unit_uid,
      dataValues,
    };

    // Auth
    let password: string | null = null;
    if (mapping.dhis2_password_secret_id) {
      password = await fetchVaultSecret(admin, mapping.dhis2_password_secret_id);
    }
    const basicAuth = mapping.dhis2_username && password
      ? "Basic " + btoa(`${mapping.dhis2_username}:${password}`)
      : undefined;

    let response: Response;
    let body: any;
    let succeeded = false;
    try {
      response = await postWithRetry(`${mapping.dhis2_endpoint_url.replace(/\/+$/, "")}/api/dataValueSets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(basicAuth ? { Authorization: basicAuth } : {}),
        },
        body: JSON.stringify(payload),
      });
      body = await response.json().catch(() => ({ raw: "non-json response" }));
      succeeded = response.ok;
    } catch (e: any) {
      body = { error: e?.message || String(e) };
      succeeded = false;
    }

    await admin.from("moh_reports").update({
      dhis2_response: { ...body, http_status: (typeof body === "object" && (body as any).http_status) || (response! ? response!.status : null), skipped, payload_summary: { period, orgUnit: mapping.dhis2_org_unit_uid, count: dataValues.length } },
      dhis2_submitted_at: succeeded ? new Date().toISOString() : null,
      dhis2_attempt_count: (report.dhis2_attempt_count || 0) + 1,
      submission_status: succeeded ? "submitted" : report.submission_status,
    }).eq("id", report.id);

    if (succeeded) {
      await admin.from("dhis2_facility_mappings").update({ last_submission_at: new Date().toISOString() }).eq("id", mapping.id);
    }

    return new Response(JSON.stringify({ succeeded, period, dataValueCount: dataValues.length, skipped, response: body }), {
      status: succeeded ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("dhis2-submit error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
