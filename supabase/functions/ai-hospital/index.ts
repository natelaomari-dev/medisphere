import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000;

function redact(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, "[SSN]")
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[EMAIL]")
    .replace(/\+?\d[\d\s-]{7,}\d/g, "[PHONE]")
    .slice(0, 2000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    // Resolve hospital
    const { data: membership } = await admin
      .from("hospital_members")
      .select("hospital_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const hospitalId = membership?.hospital_id ?? null;

    // Rate limiting (sliding 1-hour window)
    const windowFloor = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await admin
      .from("ai_processing_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowFloor);
    if ((count ?? 0) >= RATE_LIMIT) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (60 calls/hour)." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, data } = await req.json();

    // Consent gate: if patient-identifiable data is present, require active ai_processing consent
    if (data?.patient_id && (type === "triage" || type === "doctor_assist")) {
      const { data: consent } = await admin
        .from("patient_consents")
        .select("status, expires_at")
        .eq("patient_id", data.patient_id)
        .eq("consent_type", "ai_processing")
        .eq("status", "granted")
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const valid = consent && (!consent.expires_at || new Date(consent.expires_at) > new Date());
      if (!valid) {
        return new Response(JSON.stringify({
          error: "Patient has not granted AI processing consent. Please record consent before using AI features for this patient.",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "triage") {
      systemPrompt = `You are an AI medical triage assistant for a hospital. Analyze patient symptoms and return a JSON response with:
- riskLevel: "low", "medium", or "critical"
- score: number 0-100 indicating severity
- recommendation: brief clinical recommendation
- suggestedDepartment: which department to refer to
- estimatedWait: estimated wait time based on severity
Keep responses concise and clinical.`;
      userPrompt = `Patient symptoms: ${data.symptoms}`;
    } else if (type === "insights") {
      systemPrompt = `You are an AI hospital intelligence engine. Analyze hospital data and generate predictive insights. Return a JSON array of insights, each with:
- title: brief alert title
- message: detailed description
- severity: "low", "medium", "high", or "critical"
- confidence: number 0-100
- alertType: one of "sepsis_risk", "deterioration", "readmission", "drug_interaction", "icu_transfer", "outbreak", "staffing", "capacity"
Generate 3-5 realistic hospital insights.`;
      userPrompt = `Current hospital status: ${JSON.stringify(data)}`;
    } else if (type === "doctor_assist") {
      systemPrompt = `You are an AI clinical assistant helping doctors during consultations. Provide:
- Suggested diagnoses based on symptoms
- Recommended tests
- Treatment options
- Drug interaction warnings
Be concise and evidence-based.`;
      userPrompt = data.query;
    }

    // Audit log BEFORE sending to gateway
    const redactedPayload = { type, payload: redact(JSON.stringify(data ?? {})) };
    const { data: logRow } = await admin
      .from("ai_processing_log")
      .insert({
        user_id: userId,
        hospital_id: hospitalId,
        patient_id: data?.patient_id ?? null,
        prompt_type: type,
        redacted_payload: redactedPayload,
      })
      .select("id")
      .single();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Update audit log with response summary
    if (logRow?.id) {
      await admin
        .from("ai_processing_log")
        .update({ response_summary: content.slice(0, 500) })
        .eq("id", logRow.id);
    }

    // Persist triage result
    if (type === "triage" && hospitalId) {
      let parsed: any = {};
      try {
        const m = content.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      } catch { /* ignore */ }
      await admin.from("triage_records").insert({
        hospital_id: hospitalId,
        assessed_by: userId,
        patient_id: data?.patient_id ?? null,
        symptoms: data?.symptoms ?? "",
        ai_recommendation: parsed.recommendation ?? content.slice(0, 1000),
        suggested_department: parsed.suggestedDepartment ?? parsed.suggested_department ?? null,
        ai_risk_score: parsed.score ?? null,
        priority: (parsed.riskLevel === "critical" ? "emergency"
          : parsed.riskLevel === "medium" ? "urgent" : "non_urgent"),
      });
    }

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
