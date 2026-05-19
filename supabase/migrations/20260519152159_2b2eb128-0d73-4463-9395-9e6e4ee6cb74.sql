
-- ============================================================
-- DEFECT 1: Fix NULL hospital_id tenant isolation bypass
-- ============================================================

-- Ensure a 'demo' hospital exists for backfill
INSERT INTO public.hospitals (name, slug, country)
SELECT 'Demo Hospital', 'demo', 'Kenya'
WHERE NOT EXISTS (SELECT 1 FROM public.hospitals WHERE slug = 'demo');

-- Trigger function to default hospital_id on insert
CREATE OR REPLACE FUNCTION public.set_hospital_id_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hospital_id IS NULL THEN
    NEW.hospital_id := public.get_user_hospital_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Helper: per-table fix done inline below
DO $$
DECLARE
  demo_id uuid;
  tbl text;
  tables text[] := ARRAY['patients','appointments','doctors','medical_records','diagnoses','vitals','lab_orders','medications','prescriptions','icu_beds','teleconsultations','triage_records','ai_alerts','invoices'];
BEGIN
  SELECT id INTO demo_id FROM public.hospitals WHERE slug = 'demo';

  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('UPDATE public.%I SET hospital_id = %L WHERE hospital_id IS NULL', tbl, demo_id);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN hospital_id SET NOT NULL', tbl);
  END LOOP;
END $$;

-- Drop and recreate policies for each table (without IS NULL backdoor)

-- patients
DROP POLICY IF EXISTS "Members can view patients" ON public.patients;
DROP POLICY IF EXISTS "Members can create patients" ON public.patients;
DROP POLICY IF EXISTS "Members can update patients" ON public.patients;
CREATE POLICY "Members can view patients" ON public.patients FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update patients" ON public.patients FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- appointments
DROP POLICY IF EXISTS "Members can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Members can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Members can update appointments" ON public.appointments;
CREATE POLICY "Members can view appointments" ON public.appointments FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- doctors
DROP POLICY IF EXISTS "Members can view doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;
CREATE POLICY "Members can view doctors" ON public.doctors FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL TO authenticated USING (is_hospital_admin(auth.uid(), hospital_id)) WITH CHECK (is_hospital_admin(auth.uid(), hospital_id));

-- medical_records
DROP POLICY IF EXISTS "Members can view medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Members can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Members can update medical records" ON public.medical_records;
CREATE POLICY "Members can view medical records" ON public.medical_records FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create medical records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update medical records" ON public.medical_records FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- diagnoses
DROP POLICY IF EXISTS "Members can view diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Members can create diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Members can update diagnoses" ON public.diagnoses;
CREATE POLICY "Members can view diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create diagnoses" ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update diagnoses" ON public.diagnoses FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- vitals
DROP POLICY IF EXISTS "Members can view vitals" ON public.vitals;
DROP POLICY IF EXISTS "Members can create vitals" ON public.vitals;
DROP POLICY IF EXISTS "Members can update vitals" ON public.vitals;
CREATE POLICY "Members can view vitals" ON public.vitals FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update vitals" ON public.vitals FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- lab_orders
DROP POLICY IF EXISTS "Members can view lab orders" ON public.lab_orders;
DROP POLICY IF EXISTS "Members can create lab orders" ON public.lab_orders;
DROP POLICY IF EXISTS "Members can update lab orders" ON public.lab_orders;
CREATE POLICY "Members can view lab orders" ON public.lab_orders FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create lab orders" ON public.lab_orders FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update lab orders" ON public.lab_orders FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- medications
DROP POLICY IF EXISTS "Members can view medications" ON public.medications;
DROP POLICY IF EXISTS "Members can create medications" ON public.medications;
DROP POLICY IF EXISTS "Members can update medications" ON public.medications;
CREATE POLICY "Members can view medications" ON public.medications FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update medications" ON public.medications FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- prescriptions
DROP POLICY IF EXISTS "Members can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Members can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Members can update prescriptions" ON public.prescriptions;
CREATE POLICY "Members can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- icu_beds
DROP POLICY IF EXISTS "Members can view ICU beds" ON public.icu_beds;
DROP POLICY IF EXISTS "Members can create ICU beds" ON public.icu_beds;
DROP POLICY IF EXISTS "Members can update ICU beds" ON public.icu_beds;
CREATE POLICY "Members can view ICU beds" ON public.icu_beds FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create ICU beds" ON public.icu_beds FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update ICU beds" ON public.icu_beds FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- teleconsultations
DROP POLICY IF EXISTS "Members can view teleconsultations" ON public.teleconsultations;
DROP POLICY IF EXISTS "Members can create teleconsultations" ON public.teleconsultations;
DROP POLICY IF EXISTS "Members can update teleconsultations" ON public.teleconsultations;
CREATE POLICY "Members can view teleconsultations" ON public.teleconsultations FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create teleconsultations" ON public.teleconsultations FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update teleconsultations" ON public.teleconsultations FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- triage_records
DROP POLICY IF EXISTS "Members can view triage" ON public.triage_records;
DROP POLICY IF EXISTS "Members can create triage" ON public.triage_records;
CREATE POLICY "Members can view triage" ON public.triage_records FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create triage" ON public.triage_records FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

-- ai_alerts
DROP POLICY IF EXISTS "Members can view alerts" ON public.ai_alerts;
DROP POLICY IF EXISTS "Members can create alerts" ON public.ai_alerts;
DROP POLICY IF EXISTS "Members can update alerts" ON public.ai_alerts;
CREATE POLICY "Members can view alerts" ON public.ai_alerts FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create alerts" ON public.ai_alerts FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update alerts" ON public.ai_alerts FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- invoices
DROP POLICY IF EXISTS "Members can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Members can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Members can update invoices" ON public.invoices;
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- Attach default trigger to all tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['patients','appointments','doctors','medical_records','diagnoses','vitals','lab_orders','medications','prescriptions','icu_beds','teleconsultations','triage_records','ai_alerts','invoices'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_hospital_id_default_trg ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER set_hospital_id_default_trg BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_default()', tbl);
  END LOOP;
END $$;

-- ============================================================
-- DEFECT 2: AI rate limit + audit log tables
-- ============================================================

CREATE TABLE public.ai_rate_limits (
  user_id uuid NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own rate limits" ON public.ai_rate_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ai_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hospital_id uuid,
  patient_id uuid,
  prompt_type text NOT NULL,
  redacted_payload jsonb,
  response_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_processing_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospital admins view AI logs" ON public.ai_processing_log FOR SELECT TO authenticated USING (is_hospital_admin(auth.uid(), hospital_id) OR is_platform_admin(auth.uid()));

-- ============================================================
-- DEFECT 3: Clinical audit log (append-only)
-- ============================================================

CREATE TABLE public.clinical_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  actor_role text,
  hospital_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('select','insert','update','delete')),
  table_name text NOT NULL,
  record_id uuid,
  patient_id uuid,
  accessed_columns text[],
  ip_address inet,
  user_agent text,
  justification text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_audit_hospital ON public.clinical_audit_log(hospital_id, created_at DESC);
CREATE INDEX idx_clinical_audit_patient ON public.clinical_audit_log(patient_id, created_at DESC);

ALTER TABLE public.clinical_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated insert own audit"
ON public.clinical_audit_log FOR INSERT TO authenticated
WITH CHECK (actor_user_id = auth.uid());

CREATE POLICY "Admins view hospital audit"
ON public.clinical_audit_log FOR SELECT TO authenticated
USING (is_hospital_admin(auth.uid(), hospital_id) OR is_platform_admin(auth.uid()));

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.write_clinical_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_rec record;
  v_patient_id uuid;
  v_hospital_id uuid;
  v_record_id uuid;
BEGIN
  v_action := lower(TG_OP);
  IF TG_OP = 'DELETE' THEN
    v_rec := OLD;
  ELSE
    v_rec := NEW;
  END IF;

  v_record_id := (row_to_json(v_rec)->>'id')::uuid;
  v_hospital_id := (row_to_json(v_rec)->>'hospital_id')::uuid;

  IF TG_TABLE_NAME = 'patients' THEN
    v_patient_id := v_record_id;
  ELSE
    v_patient_id := (row_to_json(v_rec)->>'patient_id')::uuid;
  END IF;

  IF auth.uid() IS NULL OR v_hospital_id IS NULL THEN
    RETURN v_rec;
  END IF;

  INSERT INTO public.clinical_audit_log (actor_user_id, hospital_id, action, table_name, record_id, patient_id)
  VALUES (auth.uid(), v_hospital_id, v_action, TG_TABLE_NAME, v_record_id, v_patient_id);

  RETURN v_rec;
END;
$$;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['patients','medical_records','diagnoses','vitals','prescriptions','lab_orders','admissions','nurse_notes'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS clinical_audit_trg ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER clinical_audit_trg AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.write_clinical_audit()', tbl);
  END LOOP;
END $$;
