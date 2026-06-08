// Africa's Talking SMS + Twilio/Meta WhatsApp dispatcher
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function renderTemplate(hospital_id: string, key: string, channel: string, lang: string, payload: Record<string, any>) {
  const { data } = await admin.rpc("render_notification", {
    _hospital_id: hospital_id, _template_key: key, _channel: channel, _language: lang, _payload: payload,
  });
  return data as { subject?: string; body: string; language: string } | null;
}

async function sendAfricasTalkingSMS(to: string, message: string, from?: string) {
  if (!AT_API_KEY || !AT_USERNAME) throw new Error("AT_API_KEY / AT_USERNAME not configured");
  const body = new URLSearchParams({ username: AT_USERNAME, to, message, ...(from ? { from } : {}) });
  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey: AT_API_KEY, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`AT error: ${JSON.stringify(json)}`);
  const recipient = json?.SMSMessageData?.Recipients?.[0];
  if (!recipient || recipient.status !== "Success") {
    throw new Error(`AT recipient status: ${recipient?.status || "unknown"}`);
  }
  return { providerId: recipient.messageId, provider: "africastalking" };
}

async function sendTwilioWhatsApp(to: string, body: string, cfg: any) {
  const sid = Deno.env.get(cfg.twilio_account_sid_secret_id || "");
  const token = Deno.env.get(cfg.twilio_auth_token_secret_id || "");
  const from = cfg.whatsapp_from;
  if (!sid || !token || !from) throw new Error("Twilio config incomplete for this hospital");
  const auth = btoa(`${sid}:${token}`);
  const params = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Twilio: ${json.message || res.statusText}`);
  return { providerId: json.sid, provider: "twilio" };
}

async function sendMetaWhatsApp(to: string, body: string, cfg: any) {
  const token = Deno.env.get(cfg.meta_access_token_secret_id || "");
  const phoneId = cfg.meta_phone_number_id;
  if (!token || !phoneId) throw new Error("Meta config incomplete for this hospital");
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Meta: ${json?.error?.message || res.statusText}`);
  return { providerId: json?.messages?.[0]?.id, provider: "meta" };
}

async function processOne(row: any) {
  await admin.from("notification_queue").update({ status: "sending", attempt_count: (row.attempt_count || 0) + 1 }).eq("id", row.id);

  // Resolve patient language
  let lang = row.language || "en";
  if (row.patient_id && !row.language) {
    const { data: p } = await admin.from("patients").select("preferred_language").eq("id", row.patient_id).maybeSingle();
    lang = p?.preferred_language || "en";
  }

  const tpl = await renderTemplate(row.hospital_id, row.template_key, row.channel, lang, row.payload || {});
  if (!tpl) {
    await admin.from("notification_queue").update({ status: "failed", error_message: `Template not found: ${row.template_key}/${row.channel}/${lang}` }).eq("id", row.id);
    return;
  }

  try {
    let result;
    if (row.channel === "sms") {
      const { data: cfg } = await admin.from("hospital_messaging_config").select("sms_sender_id, sms_provider").eq("hospital_id", row.hospital_id).maybeSingle();
      result = await sendAfricasTalkingSMS(row.recipient, tpl.body, cfg?.sms_sender_id);
    } else if (row.channel === "whatsapp") {
      const { data: cfg } = await admin.from("hospital_messaging_config").select("*").eq("hospital_id", row.hospital_id).maybeSingle();
      if (!cfg) throw new Error("No messaging config for hospital");
      result = cfg.whatsapp_provider === "meta"
        ? await sendMetaWhatsApp(row.recipient, tpl.body, cfg)
        : await sendTwilioWhatsApp(row.recipient, tpl.body, cfg);
    } else if (row.channel === "email") {
      throw new Error("Email channel not yet implemented");
    } else {
      throw new Error(`Unknown channel: ${row.channel}`);
    }

    await admin.from("notification_queue").update({
      status: "sent",
      provider: result.provider,
      provider_message_id: result.providerId,
      rendered_subject: tpl.subject,
      rendered_body: tpl.body,
      sent_at: new Date().toISOString(),
    }).eq("id", row.id);
  } catch (e) {
    await admin.from("notification_queue").update({
      status: "failed",
      error_message: String((e as Error).message || e),
      rendered_body: tpl.body,
    }).eq("id", row.id);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100);

    const { data: rows, error } = await admin
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(limit);
    if (error) throw error;

    let processed = 0;
    for (const row of rows || []) { await processOne(row); processed++; }

    return new Response(JSON.stringify({ processed, total_found: rows?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
