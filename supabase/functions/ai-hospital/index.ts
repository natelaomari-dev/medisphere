import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data } = await req.json();
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
