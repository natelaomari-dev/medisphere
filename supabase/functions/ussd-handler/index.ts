// Africa's Talking USSD callback handler
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function reply(text: string, end = false) {
  const prefix = end ? "END " : "CON ";
  return new Response(prefix + text, { headers: { ...corsHeaders, "Content-Type": "text/plain" } });
}

async function findPatient(phone: string) {
  // Normalize: keep last 9 digits for KE matching variations
  const tail = phone.replace(/\D/g, "").slice(-9);
  const { data: contacts } = await admin
    .from("patient_contacts")
    .select("patient_id, value, patients(first_name, last_name, hospital_id, preferred_language)")
    .ilike("value", `%${tail}`)
    .limit(1);
  return contacts?.[0] ? { patient_id: contacts[0].patient_id, ...(contacts[0].patients as any) } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const form = await req.formData();
    const sessionId = String(form.get("sessionId") || "");
    const phoneNumber = String(form.get("phoneNumber") || "");
    const text = String(form.get("text") || "");
    const steps = text.split("*").filter(Boolean);

    // Level 0 — main menu
    if (steps.length === 0) {
      return reply([
        "Welcome to MediSphere",
        "1. Next appointment",
        "2. Last visit",
        "3. Pending bills",
        "4. Request callback",
      ].join("\n"));
    }

    const patient = await findPatient(phoneNumber);
    if (!patient) {
      return reply("Phone not linked to a patient record. Please visit reception to register.", true);
    }

    const choice = steps[0];
    if (choice === "1") {
      const { data: appt } = await admin
        .from("appointments")
        .select("appointment_date, reason, doctors(full_name)")
        .eq("patient_id", patient.patient_id)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!appt) return reply("No upcoming appointments.", true);
      const dt = new Date(appt.appointment_date as any).toUTCString().slice(0, 22);
      const dr = (appt.doctors as any)?.full_name || "doctor";
      return reply(`Next: ${dt} with ${dr}. ${appt.reason || ""}`.trim(), true);
    }

    if (choice === "2") {
      const { data: visit } = await admin
        .from("medical_records")
        .select("visit_date, chief_complaint, diagnosis")
        .eq("patient_id", patient.patient_id)
        .order("visit_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!visit) return reply("No prior visits on record.", true);
      const d = String(visit.visit_date || "").slice(0, 10);
      return reply(`Last visit ${d}: ${(visit.chief_complaint || visit.diagnosis || "see clinic").slice(0, 100)}`, true);
    }

    if (choice === "3") {
      const { data: bills } = await admin
        .from("invoices")
        .select("amount, currency, status")
        .eq("patient_id", patient.patient_id)
        .in("status", ["pending", "partial", "unpaid"])
        .limit(5);
      if (!bills || bills.length === 0) return reply("No pending bills.", true);
      const total = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
      const cur = bills[0]?.currency || "KES";
      return reply(`Pending: ${cur} ${total.toFixed(2)} across ${bills.length} invoice(s).`, true);
    }

    if (choice === "4") {
      await admin.from("notification_queue").insert({
        hospital_id: patient.hospital_id,
        patient_id: patient.patient_id,
        channel: "sms",
        template_key: "callback_request",
        language: patient.preferred_language || "en",
        recipient: phoneNumber,
        payload: { patient_name: patient.first_name },
        rendered_body: `Callback requested by ${patient.first_name} ${patient.last_name} on ${phoneNumber}.`,
        status: "pending",
      });
      return reply("Your request has been logged. Staff will call you shortly.", true);
    }

    return reply("Invalid option.", true);
  } catch (e) {
    return new Response("END Service unavailable. Try again.", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" }, status: 200,
    });
  }
});
