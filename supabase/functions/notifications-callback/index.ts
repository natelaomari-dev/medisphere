// Delivery callback receiver for Africa's Talking + Twilio + Meta
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function statusFromProvider(provider: string, raw: string): string | null {
  const s = (raw || "").toLowerCase();
  if (provider === "africastalking") {
    if (["success", "delivered"].includes(s)) return "delivered";
    if (["failed", "rejected", "userindblacklist"].includes(s)) return "failed";
    if (["sent", "buffered", "submitted"].includes(s)) return "sent";
  }
  if (provider === "twilio") {
    if (s === "delivered" || s === "read") return "delivered";
    if (s === "failed" || s === "undelivered") return "failed";
    if (s === "sent") return "sent";
  }
  if (provider === "meta") {
    if (s === "delivered" || s === "read") return "delivered";
    if (s === "failed") return "failed";
    if (s === "sent") return "sent";
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "africastalking";
    const ct = req.headers.get("content-type") || "";

    let providerId: string | undefined;
    let status: string | undefined;

    if (ct.includes("application/json")) {
      const body = await req.json();
      // Meta webhook envelope
      if (provider === "meta") {
        const st = body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
        providerId = st?.id; status = st?.status;
      } else {
        providerId = body.id || body.messageId || body.MessageSid;
        status = body.status || body.MessageStatus;
      }
    } else {
      const form = await req.formData();
      providerId = (form.get("id") || form.get("messageId") || form.get("MessageSid")) as string;
      status = (form.get("status") || form.get("MessageStatus")) as string;
    }

    if (!providerId || !status) return new Response("ok", { headers: corsHeaders });

    const mapped = statusFromProvider(provider, status);
    if (!mapped) return new Response("ok", { headers: corsHeaders });

    const updates: any = { status: mapped };
    if (mapped === "delivered") updates.delivered_at = new Date().toISOString();
    await admin.from("notification_queue").update(updates).eq("provider_message_id", providerId);

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
