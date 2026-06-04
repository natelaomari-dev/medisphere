
-- =================================================================
-- PHARMACY BATCH TRACKING
-- =================================================================

ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS atc_code text;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS substance text;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS drug_class text;

CREATE TABLE IF NOT EXISTS public.medication_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  lot_number text,
  manufacturing_date date,
  expiry_date date NOT NULL,
  quantity_received integer NOT NULL CHECK (quantity_received >= 0),
  quantity_remaining integer NOT NULL CHECK (quantity_remaining >= 0),
  unit_cost numeric(12,2),
  supplier text,
  supplier_invoice text,
  received_date date NOT NULL DEFAULT current_date,
  received_by uuid REFERENCES auth.users(id),
  storage_location text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','quarantined','expired','recalled','depleted')),
  barcode text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medication_batches_med ON public.medication_batches(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_batches_hospital ON public.medication_batches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medication_batches_fefo ON public.medication_batches(medication_id, status, expiry_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_batches TO authenticated;
GRANT ALL ON public.medication_batches TO service_role;
ALTER TABLE public.medication_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view batches" ON public.medication_batches FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create batches" ON public.medication_batches FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update batches" ON public.medication_batches FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_medication_batches_uat BEFORE UPDATE ON public.medication_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.medication_dispenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.medication_batches(id),
  hospital_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  quantity_dispensed integer NOT NULL CHECK (quantity_dispensed > 0),
  dispensed_by uuid REFERENCES auth.users(id),
  dispensed_at timestamptz NOT NULL DEFAULT now(),
  counseling_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medication_dispenses_prescription ON public.medication_dispenses(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medication_dispenses_hospital ON public.medication_dispenses(hospital_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_dispenses TO authenticated;
GRANT ALL ON public.medication_dispenses TO service_role;
ALTER TABLE public.medication_dispenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view dispenses" ON public.medication_dispenses FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create dispenses" ON public.medication_dispenses FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE OR REPLACE VIEW public.medication_stock AS
SELECT 
  m.id AS medication_id, m.hospital_id, m.name,
  COALESCE(SUM(b.quantity_remaining) FILTER (WHERE b.status = 'available' AND b.expiry_date >= current_date), 0)::int AS total_available,
  MIN(b.expiry_date) FILTER (WHERE b.status = 'available' AND b.quantity_remaining > 0) AS earliest_expiry,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'available') AS batch_count
FROM public.medications m
LEFT JOIN public.medication_batches b ON b.medication_id = m.id
GROUP BY m.id, m.hospital_id, m.name;
GRANT SELECT ON public.medication_stock TO authenticated;

CREATE OR REPLACE FUNCTION public.dispense_medication(_prescription_id uuid, _quantity integer, _counseling text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pres record; v_batch record; v_remaining int := _quantity; v_take int;
  v_user uuid := auth.uid();
  v_splits jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_pres FROM public.prescriptions WHERE id = _prescription_id;
  IF v_pres IS NULL THEN RAISE EXCEPTION 'Prescription % not found', _prescription_id; END IF;
  IF NOT is_hospital_member(v_user, v_pres.hospital_id) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

  FOR v_batch IN
    SELECT * FROM public.medication_batches
    WHERE medication_id = v_pres.medication_id AND hospital_id = v_pres.hospital_id
      AND status = 'available' AND expiry_date >= current_date AND quantity_remaining > 0
    ORDER BY expiry_date ASC, received_date ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_batch.quantity_remaining, v_remaining);
    INSERT INTO public.medication_dispenses(prescription_id, batch_id, hospital_id, patient_id, quantity_dispensed, dispensed_by, counseling_notes)
    VALUES (_prescription_id, v_batch.id, v_pres.hospital_id, v_pres.patient_id, v_take, v_user, _counseling);
    UPDATE public.medication_batches
      SET quantity_remaining = quantity_remaining - v_take,
          status = CASE WHEN quantity_remaining - v_take <= 0 THEN 'depleted' ELSE status END
      WHERE id = v_batch.id;
    v_splits := v_splits || jsonb_build_object('batch_id', v_batch.id, 'batch_number', v_batch.batch_number, 'quantity', v_take, 'expiry', v_batch.expiry_date);
    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock: % units short', v_remaining;
  END IF;

  UPDATE public.prescriptions SET status='dispensed', dispensed_by=v_user, dispensed_at=now() WHERE id=_prescription_id;
  INSERT INTO public.clinical_audit_log(actor_user_id, hospital_id, action, table_name, record_id, patient_id)
    VALUES (v_user, v_pres.hospital_id, 'dispense', 'prescriptions', _prescription_id, v_pres.patient_id);
  RETURN jsonb_build_object('dispensed', _quantity, 'splits', v_splits);
END $$;

CREATE OR REPLACE FUNCTION public.sweep_expired_batches()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expired int; v_soon int; r record;
BEGIN
  UPDATE public.medication_batches SET status='expired'
    WHERE status='available' AND expiry_date < current_date;
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  v_soon := 0;
  FOR r IN
    SELECT b.hospital_id, b.medication_id, m.name, b.batch_number, b.expiry_date, b.quantity_remaining
    FROM public.medication_batches b JOIN public.medications m ON m.id = b.medication_id
    WHERE b.status='available' AND b.expiry_date BETWEEN current_date AND current_date + 90
      AND b.quantity_remaining > 0
  LOOP
    INSERT INTO public.ai_alerts(hospital_id, alert_type, severity, title, message, confidence)
    VALUES (r.hospital_id, 'batch_expiring', 'medium', 'Batch expiring: '||r.name,
      'Batch '||r.batch_number||' ('||r.quantity_remaining||' units) expires '||r.expiry_date, 1.0);
    v_soon := v_soon + 1;
  END LOOP;
  RETURN jsonb_build_object('expired', v_expired, 'expiring_soon', v_soon);
END $$;

-- =================================================================
-- DRUG INTERACTIONS & OVERRIDES
-- =================================================================

CREATE TABLE IF NOT EXISTS public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a_code text NOT NULL,
  drug_a_name text NOT NULL,
  drug_b_code text NOT NULL,
  drug_b_name text NOT NULL,
  code_system text NOT NULL DEFAULT 'atc',
  severity text NOT NULL CHECK (severity IN ('minor','moderate','major','contraindicated')),
  description text NOT NULL,
  management text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_a ON public.drug_interactions(drug_a_code);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_b ON public.drug_interactions(drug_b_code);
GRANT SELECT ON public.drug_interactions TO authenticated;
GRANT ALL ON public.drug_interactions TO service_role;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads interactions" ON public.drug_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admin manages interactions" ON public.drug_interactions FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.prescription_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  override_type text NOT NULL CHECK (override_type IN ('interaction','allergy','dose','duplicate')),
  warning_details jsonb NOT NULL,
  justification text NOT NULL,
  acknowledged_by uuid NOT NULL REFERENCES auth.users(id),
  acknowledged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prescription_overrides_pres ON public.prescription_overrides(prescription_id);
GRANT SELECT, INSERT ON public.prescription_overrides TO authenticated;
GRANT ALL ON public.prescription_overrides TO service_role;
ALTER TABLE public.prescription_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view overrides" ON public.prescription_overrides FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create overrides" ON public.prescription_overrides FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id) AND acknowledged_by = auth.uid());

-- =================================================================
-- LAB DEPTH
-- =================================================================

CREATE TABLE IF NOT EXISTS public.lab_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  panel_name text NOT NULL,
  panel_code text NOT NULL,
  included_tests text[] NOT NULL DEFAULT '{}',
  description text,
  is_global boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_panels TO authenticated;
GRANT ALL ON public.lab_panels TO service_role;
ALTER TABLE public.lab_panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read panels" ON public.lab_panels FOR SELECT TO authenticated
  USING (is_global = true OR (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id)));
CREATE POLICY "Members manage panels" ON public.lab_panels FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update panels" ON public.lab_panels FOR UPDATE TO authenticated
  USING (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id));

CREATE TABLE IF NOT EXISTS public.lab_specimens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id uuid NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  specimen_type text NOT NULL,
  collection_datetime timestamptz NOT NULL DEFAULT now(),
  collected_by uuid REFERENCES auth.users(id),
  container text,
  volume_ml numeric,
  condition text DEFAULT 'acceptable',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_specimens_order ON public.lab_specimens(lab_order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_specimens TO authenticated;
GRANT ALL ON public.lab_specimens TO service_role;
ALTER TABLE public.lab_specimens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage specimens" ON public.lab_specimens FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE TABLE IF NOT EXISTS public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id uuid NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  test_code text,
  test_name text NOT NULL,
  loinc_code text,
  result_value text NOT NULL,
  result_numeric numeric,
  result_unit text,
  reference_range_low numeric,
  reference_range_high numeric,
  reference_range_text text,
  flag text CHECK (flag IN ('normal','low','high','critical_low','critical_high','abnormal')),
  method text,
  instrument text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  result_status text NOT NULL DEFAULT 'preliminary' CHECK (result_status IN ('preliminary','final','corrected','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON public.lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON public.lab_results(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage results" ON public.lab_results FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_lab_results_uat BEFORE UPDATE ON public.lab_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.alert_on_critical_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doctor uuid;
BEGIN
  IF NEW.flag IN ('critical_low','critical_high') THEN
    SELECT ordered_by INTO v_doctor FROM public.lab_orders WHERE id = NEW.lab_order_id;
    INSERT INTO public.ai_alerts(hospital_id, patient_id, alert_type, severity, title, message, confidence)
    VALUES (NEW.hospital_id, NEW.patient_id, 'critical_lab', 'critical'::risk_level,
      'Critical lab: '||NEW.test_name||' '||NEW.result_value||COALESCE(' '||NEW.result_unit,''),
      'Critical '||NEW.flag||' result for '||NEW.test_name||'. Notify ordering clinician immediately.', 1.0);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lab_results_critical AFTER INSERT OR UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.alert_on_critical_result();

-- =================================================================
-- OPERATING THEATRE
-- =================================================================

CREATE TABLE IF NOT EXISTS public.ot_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  room_type text NOT NULL DEFAULT 'general' CHECK (room_type IN ('general','orthopaedic','cardiac','obstetric','emergency','minor','endoscopy')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ot_rooms TO authenticated;
GRANT ALL ON public.ot_rooms TO service_role;
ALTER TABLE public.ot_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage OT rooms" ON public.ot_rooms FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE TABLE IF NOT EXISTS public.surgeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  ot_room_id uuid REFERENCES public.ot_rooms(id),
  procedure_name text NOT NULL,
  procedure_code text,
  surgeon_id uuid REFERENCES public.doctors(id),
  anaesthetist_id uuid REFERENCES public.doctors(id),
  scrub_nurse_id uuid REFERENCES auth.users(id),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  pre_op_notes text,
  anaesthesia_type text,
  intra_op_notes text,
  post_op_notes text,
  complications text,
  blood_loss_ml integer,
  specimens_taken text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_surgeries_hospital ON public.surgeries(hospital_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_patient ON public.surgeries(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgeries TO authenticated;
GRANT ALL ON public.surgeries TO service_role;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage surgeries" ON public.surgeries FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_surgeries_uat BEFORE UPDATE ON public.surgeries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.surgical_safety_checklist (
  surgery_id uuid PRIMARY KEY REFERENCES public.surgeries(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  sign_in_completed boolean NOT NULL DEFAULT false,
  sign_in_by uuid REFERENCES auth.users(id),
  sign_in_at timestamptz,
  sign_in_data jsonb,
  time_out_completed boolean NOT NULL DEFAULT false,
  time_out_by uuid REFERENCES auth.users(id),
  time_out_at timestamptz,
  time_out_data jsonb,
  sign_out_completed boolean NOT NULL DEFAULT false,
  sign_out_by uuid REFERENCES auth.users(id),
  sign_out_at timestamptz,
  sign_out_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgical_safety_checklist TO authenticated;
GRANT ALL ON public.surgical_safety_checklist TO service_role;
ALTER TABLE public.surgical_safety_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage checklist" ON public.surgical_safety_checklist FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_checklist_uat BEFORE UPDATE ON public.surgical_safety_checklist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- BLOOD BANK
-- =================================================================

CREATE TABLE IF NOT EXISTS public.blood_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  donor_number text NOT NULL,
  name text NOT NULL,
  dob date,
  sex text,
  phone text,
  blood_group text CHECK (blood_group IN ('A','B','AB','O')),
  rh_factor text CHECK (rh_factor IN ('positive','negative')),
  last_donation_date date,
  hiv_status text CHECK (hiv_status IN ('negative','positive','pending','unknown')),
  hepatitis_b text CHECK (hepatitis_b IN ('negative','positive','pending','unknown')),
  hepatitis_c text CHECK (hepatitis_c IN ('negative','positive','pending','unknown')),
  syphilis text CHECK (syphilis IN ('negative','positive','pending','unknown')),
  deferral_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_donors TO authenticated;
GRANT ALL ON public.blood_donors TO service_role;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage donors" ON public.blood_donors FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_donors_uat BEFORE UPDATE ON public.blood_donors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.blood_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.blood_donors(id),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  blood_group text,
  rh_factor text,
  component_type text NOT NULL CHECK (component_type IN ('whole_blood','packed_cells','platelets','plasma','cryoprecipitate')),
  collection_date date NOT NULL,
  expiry_date date NOT NULL,
  volume_ml integer,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','issued','expired','discarded')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_units TO authenticated;
GRANT ALL ON public.blood_units TO service_role;
ALTER TABLE public.blood_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage units" ON public.blood_units FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_units_uat BEFORE UPDATE ON public.blood_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.blood_crossmatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  blood_unit_id uuid NOT NULL REFERENCES public.blood_units(id),
  hospital_id uuid NOT NULL,
  crossmatch_date timestamptz NOT NULL DEFAULT now(),
  result text CHECK (result IN ('compatible','incompatible','pending')),
  performed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.blood_crossmatches TO authenticated;
GRANT ALL ON public.blood_crossmatches TO service_role;
ALTER TABLE public.blood_crossmatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage crossmatch" ON public.blood_crossmatches FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE TABLE IF NOT EXISTS public.blood_transfusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  blood_unit_id uuid NOT NULL REFERENCES public.blood_units(id),
  hospital_id uuid NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  indication text,
  pre_transfusion_vitals jsonb,
  post_transfusion_vitals jsonb,
  reactions text,
  witnessed_by uuid REFERENCES auth.users(id),
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.blood_transfusions TO authenticated;
GRANT ALL ON public.blood_transfusions TO service_role;
ALTER TABLE public.blood_transfusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage transfusions" ON public.blood_transfusions FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_transfusions_uat BEFORE UPDATE ON public.blood_transfusions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- MORTUARY
-- =================================================================

CREATE TABLE IF NOT EXISTS public.mortuary_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  body_id text NOT NULL,
  deceased_name text,
  deceased_patient_id uuid REFERENCES public.patients(id),
  deceased_sex text,
  estimated_age integer,
  intake_datetime timestamptz NOT NULL DEFAULT now(),
  refrigeration_unit text,
  identifying_features text,
  brought_in_by text,
  brought_in_contact text,
  police_report_number text,
  cause_of_death text,
  post_mortem_required boolean DEFAULT false,
  intake_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'in_storage' CHECK (status IN ('in_storage','released','transferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mortuary_intakes TO authenticated;
GRANT ALL ON public.mortuary_intakes TO service_role;
ALTER TABLE public.mortuary_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage mortuary" ON public.mortuary_intakes FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_mortuary_uat BEFORE UPDATE ON public.mortuary_intakes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.mortuary_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mortuary_intake_id uuid NOT NULL REFERENCES public.mortuary_intakes(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  release_datetime timestamptz NOT NULL DEFAULT now(),
  released_to_name text NOT NULL,
  released_to_id text,
  released_to_relationship text,
  released_to_phone text,
  burial_permit_number text,
  released_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mortuary_releases TO authenticated;
GRANT ALL ON public.mortuary_releases TO service_role;
ALTER TABLE public.mortuary_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage releases" ON public.mortuary_releases FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

-- =================================================================
-- QUEUE MANAGEMENT
-- =================================================================

CREATE TABLE IF NOT EXISTS public.service_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('registration','triage','consultation','lab','pharmacy','cashier','imaging')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_points TO authenticated;
GRANT ALL ON public.service_points TO service_role;
ALTER TABLE public.service_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage service points" ON public.service_points FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE TABLE IF NOT EXISTS public.patient_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  hospital_id uuid NOT NULL,
  service_point_id uuid NOT NULL REFERENCES public.service_points(id),
  ticket_number text NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','called','in_service','completed','no_show','transferred')),
  priority integer NOT NULL DEFAULT 0,
  queued_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  served_at timestamptz,
  completed_at timestamptz,
  attendant_id uuid REFERENCES auth.users(id),
  notes text
);
CREATE INDEX IF NOT EXISTS idx_patient_queue_active ON public.patient_queue(service_point_id, status, priority DESC, queued_at);
GRANT SELECT, INSERT, UPDATE ON public.patient_queue TO authenticated;
GRANT ALL ON public.patient_queue TO service_role;
ALTER TABLE public.patient_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage queue" ON public.patient_queue FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id)) WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_results;
