// Inbound HL7 v2 ORU^R01 lab results.
// Public endpoint (verify_jwt = false), authenticated by shared secret header X-HL7-Secret
// matched against hospital integration secret. Idempotent on (lab_order_id, loinc_code).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hl7-secret, x-hl7-hospital",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Minimal HL7 v2 parser. Handles \r, \n, or \r\n segment terminators.
type HL7Segment = { name: string; fields: string[]; raw: string };
function parseHL7(msg: string): HL7Segment[] {
  // First segment must be MSH; field separator is char 4 (index 3)
  const lines = msg.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length || !lines[0].startsWith("MSH")) throw new Error("Invalid HL7: missing MSH");
  const fieldSep = lines[0][3] || "|";
  return lines.map((line) => {
    const fields = line.split(fieldSep);
    return { name: fields[0], fields, raw: line };
  });
}
function getField(seg: HL7Segment | undefined, idx: number): string {
  if (!seg) return "";
  // MSH has its separator at index 1; for MSH field "MSH.3" => fields[2] but other segs start fields at 1.
  // Standard convention: PID-3 = fields[3].
  return (seg.fields[idx] || "").trim();
}
function getComponent(field: string, idx: number, sep = "^"): string {
  return (field.split(sep)[idx - 1] || "").trim();
}

function ack(ackCode: "AA" | "AE" | "AR", msgId: string, error?: string) {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const msh = `MSH|^~\\&|LOVABLE|HMS|SENDER|LAB|${ts}||ACK|${msgId}|P|2.5`;
  const msa = `MSA|${ackCode}|${msgId}${error ? `|${error}` : ""}`;
  return `${msh}\r${msa}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(ack("AE", "0", "Method not allowed"), { status: 405, headers: corsHeaders });

  try {
    const secret = req.headers.get("x-hl7-secret");
    const hospitalId = req.headers.get("x-hl7-hospital");
    if (!secret || !hospitalId) {
      return new Response(ack("AR", "0", "Missing X-HL7-Secret or X-HL7-Hospital"), { status: 401, headers: corsHeaders });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate: find a hl7 webhook with matching secret for this hospital
    const { data: integration } = await admin.from("outbound_webhooks")
      .select("id, secret, is_active").eq("hospital_id", hospitalId)
      .eq("name", "hl7-inbound").eq("is_active", true).maybeSingle();
    if (!integration || integration.secret !== secret) {
      return new Response(ack("AR", "0", "Invalid credentials"), { status: 401, headers: corsHeaders });
    }

    const raw = await req.text();
    const segments = parseHL7(raw);
    const msh = segments.find((s) => s.name === "MSH");
    const pid = segments.find((s) => s.name === "PID");
    const obrs = segments.filter((s) => s.name === "OBR");
    const obxs = segments.filter((s) => s.name === "OBX");

    const msgId = getField(msh, 10) || crypto.randomUUID();

    // Resolve patient by identifier (PID-3 first repetition, ID is component 1)
    const pidIdField = getField(pid, 3);
    const patientIdent = getComponent(pidIdField, 1, "^");
    if (!patientIdent) return new Response(ack("AR", msgId, "Missing PID-3 patient identifier"), { status: 400, headers: corsHeaders });

    const { data: patient } = await admin.from("patients").select("id").eq("hospital_id", hospitalId)
      .or(`patient_id.eq.${patientIdent},id.eq.${patientIdent}`).maybeSingle();
    if (!patient) return new Response(ack("AR", msgId, `Patient not found: ${patientIdent}`), { status: 404, headers: corsHeaders });

    // Resolve order: OBR-3 is placer order #, OBR-4 is universal service ID
    const orderPlacer = getComponent(getField(obrs[0], 2), 1);
    const orderCode = getComponent(getField(obrs[0], 4), 1);
    const orderText = getComponent(getField(obrs[0], 4), 2);
    let labOrderId: string | null = null;
    if (orderPlacer) {
      const { data: ord } = await admin.from("lab_orders").select("id").eq("id", orderPlacer).eq("hospital_id", hospitalId).maybeSingle();
      if (ord) labOrderId = ord.id;
    }
    if (!labOrderId && orderCode) {
      const { data: ord } = await admin.from("lab_orders").select("id")
        .eq("hospital_id", hospitalId).eq("patient_id", patient.id)
        .or(`loinc_code.eq.${orderCode},test_name.ilike.%${orderText}%`)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (ord) labOrderId = ord.id;
    }

    const results: any[] = [];
    for (const obx of obxs) {
      // OBX-2 value type, OBX-3 observation id (LOINC ^ name), OBX-5 value, OBX-6 unit, OBX-7 ref range, OBX-8 flag
      const loinc = getComponent(getField(obx, 3), 1);
      const testName = getComponent(getField(obx, 3), 2) || orderText || "Unknown";
      const value = getField(obx, 5);
      const unit = getField(obx, 6);
      const refRange = getField(obx, 7);
      const flagCode = getField(obx, 8);
      const flagMap: Record<string, string> = { "L": "low", "H": "high", "LL": "critical_low", "HH": "critical_high", "N": "normal", "A": "abnormal" };
      const flag = flagMap[flagCode] || null;

      const numeric = Number(value);
      const { data: inserted, error } = await admin.from("lab_results").insert({
        hospital_id: hospitalId,
        patient_id: patient.id,
        lab_order_id: labOrderId,
        loinc_code: loinc,
        test_code: loinc,
        test_name: testName,
        result_value: value,
        result_numeric: isFinite(numeric) ? numeric : null,
        result_unit: unit,
        reference_range_text: refRange,
        flag,
        result_status: "final",
        notes: "Source: HL7 inbound",
      }).select("id").maybeSingle();
      if (error) {
        console.error("OBX insert failed", error);
        continue;
      }
      results.push({ loinc, value, id: inserted?.id });
    }

    if (labOrderId && results.length) {
      await admin.from("lab_orders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", labOrderId);
    }

    return new Response(ack("AA", msgId), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/hl7-v2" } });
  } catch (e: any) {
    console.error("hl7-inbound error", e);
    return new Response(ack("AE", "0", e?.message || "Parse error"), { status: 500, headers: corsHeaders });
  }
});
