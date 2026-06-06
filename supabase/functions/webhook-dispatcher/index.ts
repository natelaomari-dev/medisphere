// Outbound webhook dispatcher. Called from client/edge after key events.
// Signs payload with HMAC-SHA256 using each subscriber's secret.
// Body: { event_type, hospital_id, payload }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { event_type, hospital_id, payload } = await req.json();
    if (!event_type || !hospital_id) return new Response(JSON.stringify({ error: "event_type + hospital_id required" }), { status: 400, headers: corsHeaders });

    const { data: isMember } = await admin.rpc("is_hospital_member", { _user_id: claims.claims.sub, _hospital_id: hospital_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { data: subs } = await admin.from("outbound_webhooks")
      .select("*").eq("hospital_id", hospital_id).eq("is_active", true)
      .contains("event_types", [event_type]);

    if (!subs?.length) return new Response(JSON.stringify({ dispatched: 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const results = await Promise.all(subs.map(async (sub: any) => {
      const body = JSON.stringify({
        id: crypto.randomUUID(),
        event_type,
        hospital_id,
        delivered_at: new Date().toISOString(),
        payload,
      });
      const signature = await sign(sub.secret, body);
      let status = 0; let respBody = ""; let succeeded = false; let error: string | null = null;
      try {
        const r = await fetch(sub.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Lovable-Event": event_type,
            "X-Lovable-Signature": `sha256=${signature}`,
            "X-Lovable-Hospital": hospital_id,
          },
          body,
          signal: AbortSignal.timeout(10000),
        });
        status = r.status;
        respBody = (await r.text()).slice(0, 2000);
        succeeded = r.ok;
      } catch (e: any) { error = e?.message || String(e); }

      await admin.from("outbound_webhook_deliveries").insert({
        webhook_id: sub.id, hospital_id, event_type,
        payload: JSON.parse(body),
        response_status: status || null,
        response_body: respBody,
        succeeded, error,
      });
      await admin.from("outbound_webhooks").update({
        last_delivery_at: new Date().toISOString(),
        failure_count: succeeded ? 0 : (sub.failure_count || 0) + 1,
      }).eq("id", sub.id);

      return { webhook_id: sub.id, succeeded, status };
    }));

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("webhook-dispatcher error", e);
    return new Response(JSON.stringify({ error: e?.message }), { status: 500, headers: corsHeaders });
  }
});
