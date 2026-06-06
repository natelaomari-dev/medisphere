// FHIR R4 server: read/search + POST /Patient + transaction Bundle
// CORS + verify_jwt true (callers supply bearer token)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const FHIR_JSON = "application/fhir+json; charset=utf-8";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": FHIR_JSON },
  });
const opOutcome = (severity: "error" | "warning", code: string, diagnostics: string, status = 400) =>
  json({ resourceType: "OperationOutcome", issue: [{ severity, code, diagnostics }] }, status);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ============ Mappers: DB row -> FHIR resource ============
function patientToFHIR(p: any): any {
  const identifier = (p.patient_identifiers || []).map((i: any) => ({
    system: `urn:lovable:hms:${i.identifier_type}`,
    value: i.identifier_value,
    use: i.is_primary ? "official" : "secondary",
  }));
  identifier.unshift({ system: "urn:lovable:hms:mrn", value: p.patient_id, use: "official" });
  const telecom = (p.patient_contacts || []).map((c: any) => ({
    system: c.contact_type.includes("email") ? "email" : (c.contact_type.includes("whatsapp") ? "other" : "phone"),
    value: c.value,
    use: c.contact_type.includes("work") ? "work" : "home",
  }));
  const address = (p.patient_addresses || []).map((a: any) => ({
    use: a.address_type === "postal" ? "home" : (a.address_type || "home"),
    line: [a.street, a.village].filter(Boolean),
    city: a.sub_county || a.ward,
    district: a.county,
    state: a.region,
    postalCode: a.postal_code,
    country: a.country,
  }));
  const gender = (p.gender || p.sex_at_birth || "unknown").toString().toLowerCase();
  return {
    resourceType: "Patient",
    id: p.id,
    identifier,
    active: !p.is_deceased,
    name: [{
      use: "official",
      family: p.family_name || p.last_name,
      given: p.given_names || (p.first_name ? [p.first_name] : []),
    }],
    telecom,
    gender: ["male", "female", "other", "unknown"].includes(gender) ? gender : "unknown",
    birthDate: p.date_of_birth,
    deceasedBoolean: p.is_deceased || undefined,
    deceasedDateTime: p.date_of_death ? `${p.date_of_death}${p.time_of_death ? "T" + p.time_of_death : ""}` : undefined,
    address,
    maritalStatus: p.marital_status ? { text: p.marital_status } : undefined,
    communication: p.preferred_language ? [{ language: { coding: [{ code: p.preferred_language }] }, preferred: true }] : undefined,
    meta: { lastUpdated: p.updated_at, profile: ["http://hl7.org/fhir/StructureDefinition/Patient"] },
  };
}

function encounterToFHIR(r: any): any {
  return {
    resourceType: "Encounter",
    id: r.id,
    status: r.status || "finished",
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: (r.visit_type || "AMB").toUpperCase().slice(0, 4) },
    subject: { reference: `Patient/${r.patient_id}` },
    participant: r.doctor_id ? [{ individual: { reference: `Practitioner/${r.doctor_id}` } }] : undefined,
    period: { start: r.created_at },
    reasonCode: r.chief_complaint ? [{ text: r.chief_complaint }] : undefined,
    meta: { lastUpdated: r.updated_at },
  };
}

// LOINC for common vitals
const VITAL_LOINC: Record<string, { code: string; display: string; unit: string }> = {
  systolic_bp: { code: "8480-6", display: "Systolic blood pressure", unit: "mm[Hg]" },
  diastolic_bp: { code: "8462-4", display: "Diastolic blood pressure", unit: "mm[Hg]" },
  heart_rate: { code: "8867-4", display: "Heart rate", unit: "/min" },
  temperature: { code: "8310-5", display: "Body temperature", unit: "Cel" },
  respiratory_rate: { code: "9279-1", display: "Respiratory rate", unit: "/min" },
  spo2: { code: "59408-5", display: "Oxygen saturation", unit: "%" },
  weight: { code: "29463-7", display: "Body weight", unit: "kg" },
  height: { code: "8302-2", display: "Body height", unit: "cm" },
  bmi: { code: "39156-5", display: "BMI", unit: "kg/m2" },
  pain_level: { code: "72514-3", display: "Pain severity", unit: "{score}" },
};

function vitalsToObservations(v: any): any[] {
  const out: any[] = [];
  const base = {
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
    subject: { reference: `Patient/${v.patient_id}` },
    encounter: v.medical_record_id ? { reference: `Encounter/${v.medical_record_id}` } : undefined,
    effectiveDateTime: v.created_at,
  };
  const pairs: Array<[string, any]> = [
    ["systolic_bp", v.blood_pressure_systolic], ["diastolic_bp", v.blood_pressure_diastolic],
    ["heart_rate", v.heart_rate], ["temperature", v.temperature],
    ["respiratory_rate", v.respiratory_rate], ["spo2", v.spo2],
    ["weight", v.weight], ["height", v.height], ["bmi", v.bmi], ["pain_level", v.pain_level],
  ];
  for (const [key, val] of pairs) {
    if (val == null) continue;
    const def = VITAL_LOINC[key];
    out.push({
      resourceType: "Observation",
      id: `${v.id}-${key}`,
      ...base,
      code: { coding: [{ system: "http://loinc.org", code: def.code, display: def.display }] },
      valueQuantity: { value: Number(val), unit: def.unit, system: "http://unitsofmeasure.org", code: def.unit },
    });
  }
  return out;
}

function conditionToFHIR(d: any): any {
  return {
    resourceType: "Condition",
    id: d.id,
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: d.diagnosis_type === "admission" ? "encounter-diagnosis" : "problem-list-item" }] }],
    code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: d.icd_code, display: d.icd_description }], text: d.icd_description },
    subject: { reference: `Patient/${d.patient_id || ""}` },
    encounter: d.medical_record_id ? { reference: `Encounter/${d.medical_record_id}` } : undefined,
    recordedDate: d.created_at,
    note: d.notes ? [{ text: d.notes }] : undefined,
  };
}

function prescriptionToFHIR(p: any): any {
  return {
    resourceType: "MedicationRequest",
    id: p.id,
    status: p.status === "dispensed" ? "completed" : "active",
    intent: "order",
    medicationCodeableConcept: { text: p.medications?.name || "Medication", coding: p.medications?.atc_code ? [{ system: "http://www.whocc.no/atc", code: p.medications.atc_code }] : undefined },
    subject: { reference: `Patient/${p.patient_id}` },
    authoredOn: p.created_at,
    requester: p.prescribed_by ? { reference: `Practitioner/${p.prescribed_by}` } : undefined,
    dosageInstruction: [{
      text: `${p.dosage || ""} ${p.frequency || ""} ${p.duration || ""}`.trim(),
      timing: p.frequency ? { code: { text: p.frequency } } : undefined,
    }],
    dispenseRequest: p.quantity ? { quantity: { value: p.quantity } } : undefined,
  };
}

function labResultToObservation(r: any): any {
  return {
    resourceType: "Observation",
    id: r.id,
    status: r.flag ? "final" : "registered",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
    code: { coding: r.loinc_code ? [{ system: "http://loinc.org", code: r.loinc_code, display: r.test_name }] : [], text: r.test_name },
    subject: { reference: `Patient/${r.patient_id}` },
    effectiveDateTime: r.resulted_at || r.created_at,
    valueQuantity: r.result_value && !isNaN(Number(r.result_value)) ? { value: Number(r.result_value), unit: r.result_unit } : undefined,
    valueString: r.result_value && isNaN(Number(r.result_value)) ? r.result_value : undefined,
    interpretation: r.flag ? [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: r.flag.replace("critical_", "").toUpperCase()[0] }] }] : undefined,
    referenceRange: r.reference_range ? [{ text: r.reference_range }] : undefined,
  };
}

function allergyToFHIR(a: any): any {
  return {
    resourceType: "AllergyIntolerance",
    id: a.id,
    clinicalStatus: { coding: [{ code: "active" }] },
    verificationStatus: { coding: [{ code: "confirmed" }] },
    patient: { reference: `Patient/${a.patient_id}` },
    code: { text: a.substance },
    reaction: a.reaction ? [{ manifestation: [{ text: a.reaction }], severity: a.severity }] : undefined,
    recordedDate: a.created_at,
  };
}

// ============ Bundle helpers ============
function bundle(resources: any[], total: number, type = "searchset"): any {
  return {
    resourceType: "Bundle",
    type,
    total,
    entry: resources.map((r) => ({ fullUrl: `${r.resourceType}/${r.id}`, resource: r })),
  };
}

// ============ CapabilityStatement ============
const CAPABILITY_STATEMENT = {
  resourceType: "CapabilityStatement",
  status: "active",
  date: new Date().toISOString(),
  publisher: "MediSphere Lovable Cloud",
  kind: "instance",
  fhirVersion: "4.0.1",
  format: ["application/fhir+json"],
  rest: [{
    mode: "server",
    resource: [
      { type: "Patient", interaction: [{ code: "read" }, { code: "search-type" }, { code: "create" }] },
      { type: "Encounter", interaction: [{ code: "read" }, { code: "search-type" }] },
      { type: "Observation", interaction: [{ code: "read" }, { code: "search-type" }] },
      { type: "Condition", interaction: [{ code: "read" }, { code: "search-type" }] },
      { type: "MedicationRequest", interaction: [{ code: "read" }, { code: "search-type" }] },
      { type: "DiagnosticReport", interaction: [{ code: "read" }, { code: "search-type" }] },
      { type: "AllergyIntolerance", interaction: [{ code: "read" }, { code: "search-type" }] },
    ],
    interaction: [{ code: "transaction" }],
  }],
};

// ============ Main handler ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return opOutcome("error", "login", "Missing bearer token", 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cerr } = await userClient.auth.getClaims(token);
    if (cerr || !claims?.claims) return opOutcome("error", "login", "Invalid token", 401);
    const userId = claims.claims.sub;

    // Resolve hospital
    const { data: membership } = await admin
      .from("hospital_members")
      .select("hospital_id")
      .eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
    if (!membership) return opOutcome("error", "forbidden", "No active hospital membership", 403);
    const hospitalId = membership.hospital_id;

    const url = new URL(req.url);
    // path is /fhir-api/<Resource>/<id?> or /<Resource>?params
    const parts = url.pathname.split("/").filter(Boolean);
    // strip leading "fhir-api" segment if present
    const idx = parts.indexOf("fhir-api");
    const segs = idx >= 0 ? parts.slice(idx + 1) : parts;
    const resource = segs[0];
    const id = segs[1];

    // metadata
    if (resource === "metadata") return json(CAPABILITY_STATEMENT);

    // ===== POST root = transaction bundle =====
    if (req.method === "POST" && !resource) {
      const body = await req.json();
      if (body.resourceType !== "Bundle" || body.type !== "transaction") {
        return opOutcome("error", "invalid", "Expected Bundle of type 'transaction'", 400);
      }
      const responses: any[] = [];
      for (const entry of (body.entry || [])) {
        const r = entry.resource;
        if (r?.resourceType === "Patient") {
          const created = await createPatient(admin, r, hospitalId, userId);
          responses.push({ response: { status: "201 Created", location: `Patient/${created.id}` }, resource: created });
        } else {
          responses.push({ response: { status: "501 Not Implemented", outcome: { resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-supported", diagnostics: `Create not supported for ${r?.resourceType}` }] } } });
        }
      }
      return json({ resourceType: "Bundle", type: "transaction-response", entry: responses });
    }

    // ===== POST /Patient =====
    if (req.method === "POST" && resource === "Patient" && !id) {
      const r = await req.json();
      if (r.resourceType !== "Patient") return opOutcome("error", "invalid", "Expected Patient resource", 400);
      const created = await createPatient(admin, r, hospitalId, userId);
      return json(created, 201);
    }

    if (req.method !== "GET") return opOutcome("error", "not-supported", `${req.method} not supported`, 405);

    const count = Math.min(parseInt(url.searchParams.get("_count") || "20"), 200);
    const offset = parseInt(url.searchParams.get("_offset") || "0");
    const sort = url.searchParams.get("_sort") || "-_lastUpdated";

    switch (resource) {
      case "Patient": {
        if (id) {
          const { data, error } = await admin.from("patients")
            .select("*, patient_identifiers(*), patient_addresses(*), patient_contacts(*)")
            .eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (error || !data) return opOutcome("error", "not-found", "Patient not found", 404);
          return json(patientToFHIR(data));
        }
        let q = admin.from("patients")
          .select("*, patient_identifiers(*), patient_addresses(*), patient_contacts(*)", { count: "exact" })
          .eq("hospital_id", hospitalId);
        const identifier = url.searchParams.get("identifier");
        const birthdate = url.searchParams.get("birthdate");
        const family = url.searchParams.get("family");
        if (identifier) q = q.or(`patient_id.eq.${identifier},insurance_number.eq.${identifier}`);
        if (birthdate) q = q.eq("date_of_birth", birthdate);
        if (family) q = q.ilike("family_name", `%${family}%`);
        q = q.order("updated_at", { ascending: sort.startsWith("-") ? false : true }).range(offset, offset + count - 1);
        const { data, error, count: total } = await q;
        if (error) return opOutcome("error", "exception", error.message, 500);
        return json(bundle((data || []).map(patientToFHIR), total || 0));
      }

      case "Encounter": {
        if (id) {
          const { data } = await admin.from("medical_records").select("*").eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (!data) return opOutcome("error", "not-found", "Encounter not found", 404);
          return json(encounterToFHIR(data));
        }
        const patient = url.searchParams.get("patient") || url.searchParams.get("subject");
        let q = admin.from("medical_records").select("*", { count: "exact" }).eq("hospital_id", hospitalId);
        if (patient) q = q.eq("patient_id", patient.replace("Patient/", ""));
        q = q.order("created_at", { ascending: false }).range(offset, offset + count - 1);
        const { data, count: total } = await q;
        return json(bundle((data || []).map(encounterToFHIR), total || 0));
      }

      case "Observation": {
        // Observation can be a vital or a lab result. id format: <vital_id>-<key> or lab UUID
        if (id) {
          if (id.includes("-") && id.split("-").length > 5) {
            // try vitals composite
            const [vid, ...rest] = id.split("-");
            const key = rest.slice(-1)[0];
            const { data: v } = await admin.from("vitals").select("*").eq("id", vid).eq("hospital_id", hospitalId).maybeSingle();
            if (v) {
              const all = vitalsToObservations(v);
              const found = all.find((o) => o.id === id);
              if (found) return json(found);
            }
          }
          const { data: lr } = await admin.from("lab_results").select("*").eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (lr) return json(labResultToObservation(lr));
          return opOutcome("error", "not-found", "Observation not found", 404);
        }
        const patient = url.searchParams.get("patient");
        const category = url.searchParams.get("category");
        const code = url.searchParams.get("code");
        const results: any[] = [];
        if (!category || category === "vital-signs") {
          let qv = admin.from("vitals").select("*").eq("hospital_id", hospitalId);
          if (patient) qv = qv.eq("patient_id", patient.replace("Patient/", ""));
          qv = qv.order("created_at", { ascending: false }).limit(count);
          const { data: vs } = await qv;
          (vs || []).forEach((v) => vitalsToObservations(v).forEach((o) => results.push(o)));
        }
        if (!category || category === "laboratory") {
          let ql = admin.from("lab_results").select("*").eq("hospital_id", hospitalId);
          if (patient) ql = ql.eq("patient_id", patient.replace("Patient/", ""));
          if (code) ql = ql.eq("loinc_code", code);
          ql = ql.order("created_at", { ascending: false }).limit(count);
          const { data: ls } = await ql;
          (ls || []).forEach((r) => results.push(labResultToObservation(r)));
        }
        const paged = results.slice(offset, offset + count);
        return json(bundle(paged, results.length));
      }

      case "Condition": {
        if (id) {
          const { data } = await admin.from("diagnoses").select("*, medical_records(patient_id)").eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (!data) return opOutcome("error", "not-found", "Condition not found", 404);
          return json(conditionToFHIR({ ...data, patient_id: data.medical_records?.patient_id }));
        }
        const patient = url.searchParams.get("patient");
        let q = admin.from("diagnoses").select("*, medical_records!inner(patient_id, hospital_id)", { count: "exact" }).eq("medical_records.hospital_id", hospitalId);
        if (patient) q = q.eq("medical_records.patient_id", patient.replace("Patient/", ""));
        q = q.order("created_at", { ascending: false }).range(offset, offset + count - 1);
        const { data, count: total } = await q;
        return json(bundle((data || []).map((d: any) => conditionToFHIR({ ...d, patient_id: d.medical_records?.patient_id })), total || 0));
      }

      case "MedicationRequest": {
        if (id) {
          const { data } = await admin.from("prescriptions").select("*, medications(name, atc_code)").eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (!data) return opOutcome("error", "not-found", "MedicationRequest not found", 404);
          return json(prescriptionToFHIR(data));
        }
        const patient = url.searchParams.get("patient");
        let q = admin.from("prescriptions").select("*, medications(name, atc_code)", { count: "exact" }).eq("hospital_id", hospitalId);
        if (patient) q = q.eq("patient_id", patient.replace("Patient/", ""));
        q = q.order("created_at", { ascending: false }).range(offset, offset + count - 1);
        const { data, count: total } = await q;
        return json(bundle((data || []).map(prescriptionToFHIR), total || 0));
      }

      case "DiagnosticReport": {
        // Group lab_results by lab_order_id => DiagnosticReport with contained Observations
        if (id) {
          const { data: order } = await admin.from("lab_orders").select("*, lab_results(*)").eq("id", id).eq("hospital_id", hospitalId).maybeSingle();
          if (!order) return opOutcome("error", "not-found", "DiagnosticReport not found", 404);
          return json({
            resourceType: "DiagnosticReport",
            id: order.id,
            status: order.status === "completed" ? "final" : "registered",
            category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB" }] }],
            code: { text: order.test_name },
            subject: { reference: `Patient/${order.patient_id}` },
            issued: order.completed_at || order.created_at,
            result: (order.lab_results || []).map((r: any) => ({ reference: `Observation/${r.id}`, display: r.test_name })),
          });
        }
        const patient = url.searchParams.get("patient");
        let q = admin.from("lab_orders").select("*, lab_results(*)", { count: "exact" }).eq("hospital_id", hospitalId);
        if (patient) q = q.eq("patient_id", patient.replace("Patient/", ""));
        q = q.order("created_at", { ascending: false }).range(offset, offset + count - 1);
        const { data, count: total } = await q;
        const reports = (data || []).map((order: any) => ({
          resourceType: "DiagnosticReport", id: order.id,
          status: order.status === "completed" ? "final" : "registered",
          code: { text: order.test_name },
          subject: { reference: `Patient/${order.patient_id}` },
          issued: order.completed_at || order.created_at,
          result: (order.lab_results || []).map((r: any) => ({ reference: `Observation/${r.id}` })),
        }));
        return json(bundle(reports, total || 0));
      }

      case "AllergyIntolerance": {
        if (id) {
          const { data } = await admin.from("patient_allergies").select("*").eq("id", id).maybeSingle();
          if (!data) return opOutcome("error", "not-found", "AllergyIntolerance not found", 404);
          // verify patient belongs to hospital
          const { data: pat } = await admin.from("patients").select("hospital_id").eq("id", data.patient_id).maybeSingle();
          if (pat?.hospital_id !== hospitalId) return opOutcome("error", "forbidden", "Cross-tenant access denied", 403);
          return json(allergyToFHIR(data));
        }
        const patient = url.searchParams.get("patient");
        let q = admin.from("patient_allergies").select("*, patients!inner(hospital_id)", { count: "exact" }).eq("patients.hospital_id", hospitalId);
        if (patient) q = q.eq("patient_id", patient.replace("Patient/", ""));
        q = q.range(offset, offset + count - 1);
        const { data, count: total } = await q;
        return json(bundle((data || []).map(allergyToFHIR), total || 0));
      }

      default:
        return opOutcome("error", "not-supported", `Resource ${resource} not supported`, 404);
    }
  } catch (e: any) {
    console.error("fhir-api error", e);
    return opOutcome("error", "exception", e?.message || "Internal error", 500);
  }
});

async function createPatient(admin: any, r: any, hospitalId: string, userId: string) {
  const officialName = (r.name || []).find((n: any) => n.use === "official") || r.name?.[0] || {};
  const given = officialName.given || [];
  const family = officialName.family || "Unknown";
  const dob = r.birthDate || null;
  const gender = (r.gender || "unknown").toLowerCase();

  // Generate MRN
  const { data: seq } = await admin.rpc("nextval" as any, { seq: "patient_id_seq" }).catch(() => ({ data: null }));
  const mrn = `P-${(seq || Date.now()).toString().slice(-6).padStart(6, "0")}`;

  const { data: patient, error } = await admin.from("patients").insert({
    hospital_id: hospitalId,
    patient_id: mrn,
    first_name: given.join(" ") || "Unknown",
    given_names: given,
    last_name: family,
    family_name: family,
    date_of_birth: dob,
    gender,
    sex_at_birth: gender,
    created_by: userId,
  }).select().single();
  if (error) throw new Error(`Patient create failed: ${error.message}`);

  // identifiers
  for (const ident of (r.identifier || [])) {
    const type = ident.system?.split(":").pop() || "other";
    await admin.from("patient_identifiers").insert({
      patient_id: patient.id, hospital_id: hospitalId,
      identifier_type: ["national_id", "passport", "birth_certificate", "refugee_id", "driving_license", "sha_number", "nhif_number", "private_insurance", "employer_id", "other"].includes(type) ? type : "other",
      identifier_value: ident.value, is_primary: ident.use === "official",
    });
  }
  // telecom
  for (const t of (r.telecom || [])) {
    await admin.from("patient_contacts").insert({
      patient_id: patient.id, hospital_id: hospitalId,
      contact_type: t.system === "email" ? "email_personal" : (t.use === "work" ? "phone_work" : "phone_personal"),
      value: t.value,
    });
  }
  // addresses
  for (const a of (r.address || [])) {
    await admin.from("patient_addresses").insert({
      patient_id: patient.id, hospital_id: hospitalId,
      address_type: a.use || "home",
      country: a.country || "Kenya",
      region: a.state, county: a.district, sub_county: a.city,
      street: (a.line || []).join(", "),
      postal_code: a.postalCode,
    });
  }

  const { data: full } = await admin.from("patients")
    .select("*, patient_identifiers(*), patient_addresses(*), patient_contacts(*)")
    .eq("id", patient.id).single();
  return patientToFHIR(full);
}
