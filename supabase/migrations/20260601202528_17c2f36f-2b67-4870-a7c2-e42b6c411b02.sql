
-- ============================================
-- PHASE 1: Maternal & Child Health (MCH)
-- ============================================

-- ANC Visits
CREATE TABLE public.mch_anc_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  visit_number int NOT NULL DEFAULT 1,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  gestational_age_weeks int,
  weight numeric,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,
  fundal_height_cm int,
  fetal_heart_rate int,
  fetal_movements text,
  urine_protein text,
  urine_glucose text,
  hb_level numeric,
  hiv_status text,
  syphilis_status text,
  malaria_status text,
  tt_dose int,
  ifas_given boolean DEFAULT false,
  mosquito_net_given boolean DEFAULT false,
  complications text,
  plan text,
  next_visit_date date,
  attended_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mch_anc_visits TO authenticated;
GRANT ALL ON public.mch_anc_visits TO service_role;
ALTER TABLE public.mch_anc_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view mch_anc_visits" ON public.mch_anc_visits FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create mch_anc_visits" ON public.mch_anc_visits FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update mch_anc_visits" ON public.mch_anc_visits FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_mch_anc_set_hospital BEFORE INSERT ON public.mch_anc_visits FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE TRIGGER trg_mch_anc_updated BEFORE UPDATE ON public.mch_anc_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deliveries
CREATE TABLE public.mch_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_time time,
  gestational_age_weeks int,
  mode text CHECK (mode IN ('svd','assisted','c_section_elective','c_section_emergency')),
  outcome text CHECK (outcome IN ('live_birth','still_birth_fresh','still_birth_macerated')),
  apgar_1min int,
  apgar_5min int,
  birth_weight_g int,
  sex text CHECK (sex IN ('male','female','ambiguous')),
  complications text,
  attended_by uuid,
  place text CHECK (place IN ('facility','home','en_route','other')) DEFAULT 'facility',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mch_deliveries TO authenticated;
GRANT ALL ON public.mch_deliveries TO service_role;
ALTER TABLE public.mch_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view mch_deliveries" ON public.mch_deliveries FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create mch_deliveries" ON public.mch_deliveries FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update mch_deliveries" ON public.mch_deliveries FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_mch_del_set_hospital BEFORE INSERT ON public.mch_deliveries FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE TRIGGER trg_mch_del_updated BEFORE UPDATE ON public.mch_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Postnatal Visits
CREATE TABLE public.mch_postnatal_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  visit_timepoint text CHECK (visit_timepoint IN ('6_hour','6_day','6_week','6_month')) NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  mother_bp_systolic int,
  mother_bp_diastolic int,
  mother_temperature numeric,
  mother_bleeding text,
  uterine_involution text,
  perineum_status text,
  breastfeeding_status text,
  baby_weight_g int,
  baby_temperature numeric,
  baby_feeding text,
  baby_jaundice boolean,
  baby_cord_status text,
  family_planning_counseled boolean DEFAULT false,
  family_planning_method text,
  complications text,
  plan text,
  attended_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mch_postnatal_visits TO authenticated;
GRANT ALL ON public.mch_postnatal_visits TO service_role;
ALTER TABLE public.mch_postnatal_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view mch_pnc" ON public.mch_postnatal_visits FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create mch_pnc" ON public.mch_postnatal_visits FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update mch_pnc" ON public.mch_postnatal_visits FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_mch_pnc_set_hospital BEFORE INSERT ON public.mch_postnatal_visits FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE TRIGGER trg_mch_pnc_updated BEFORE UPDATE ON public.mch_postnatal_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- KEPI schedule reference
CREATE TABLE public.kepi_schedule (
  id text PRIMARY KEY,
  vaccine text NOT NULL,
  dose_number int NOT NULL,
  age_weeks int NOT NULL,
  route text,
  site text,
  notes text
);
GRANT SELECT ON public.kepi_schedule TO authenticated, anon;
GRANT ALL ON public.kepi_schedule TO service_role;
ALTER TABLE public.kepi_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads kepi" ON public.kepi_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage kepi" ON public.kepi_schedule FOR ALL TO authenticated USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

INSERT INTO public.kepi_schedule (id, vaccine, dose_number, age_weeks, route, site) VALUES
  ('bcg_0','BCG',1,0,'intradermal','right upper arm'),
  ('opv_0','OPV',0,0,'oral','mouth'),
  ('opv_1','OPV',1,6,'oral','mouth'),
  ('opv_2','OPV',2,10,'oral','mouth'),
  ('opv_3','OPV',3,14,'oral','mouth'),
  ('ipv_1','IPV',1,14,'IM','right thigh'),
  ('penta_1','Pentavalent (DPT-HepB-Hib)',1,6,'IM','left thigh'),
  ('penta_2','Pentavalent (DPT-HepB-Hib)',2,10,'IM','left thigh'),
  ('penta_3','Pentavalent (DPT-HepB-Hib)',3,14,'IM','left thigh'),
  ('pcv_1','PCV10',1,6,'IM','right thigh'),
  ('pcv_2','PCV10',2,10,'IM','right thigh'),
  ('pcv_3','PCV10',3,14,'IM','right thigh'),
  ('rota_1','Rotavirus',1,6,'oral','mouth'),
  ('rota_2','Rotavirus',2,10,'oral','mouth'),
  ('mr_1','Measles-Rubella',1,39,'subcutaneous','left upper arm'),
  ('mr_2','Measles-Rubella',2,78,'subcutaneous','left upper arm'),
  ('yf_1','Yellow Fever',1,39,'subcutaneous','right upper arm'),
  ('vita_1','Vitamin A',1,26,'oral','mouth'),
  ('vita_2','Vitamin A',2,52,'oral','mouth');

-- Child Immunizations
CREATE TABLE public.child_immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  kepi_id text REFERENCES public.kepi_schedule(id),
  vaccine text NOT NULL,
  dose_number int NOT NULL,
  scheduled_date date,
  given_date date,
  batch_number text,
  given_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_child_imm_patient ON public.child_immunizations(child_patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_immunizations TO authenticated;
GRANT ALL ON public.child_immunizations TO service_role;
ALTER TABLE public.child_immunizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view child_imm" ON public.child_immunizations FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create child_imm" ON public.child_immunizations FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update child_imm" ON public.child_immunizations FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE OR REPLACE FUNCTION public.set_hospital_id_from_child()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.hospital_id IS NULL AND NEW.child_patient_id IS NOT NULL THEN
    SELECT hospital_id INTO NEW.hospital_id FROM public.patients WHERE id = NEW.child_patient_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_child_imm_set_hospital BEFORE INSERT ON public.child_immunizations FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_child();
CREATE TRIGGER trg_child_imm_updated BEFORE UPDATE ON public.child_immunizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WHO Growth Standards (compact: median weight and SD by age in months, by sex)
CREATE TABLE public.who_growth_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sex text NOT NULL CHECK (sex IN ('male','female')),
  age_months int NOT NULL,
  weight_median numeric NOT NULL,
  weight_sd numeric NOT NULL,
  height_median numeric NOT NULL,
  height_sd numeric NOT NULL,
  UNIQUE(sex, age_months)
);
GRANT SELECT ON public.who_growth_standards TO authenticated, anon;
GRANT ALL ON public.who_growth_standards TO service_role;
ALTER TABLE public.who_growth_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads who_growth" ON public.who_growth_standards FOR SELECT TO authenticated USING (true);

-- Seed (approximated WHO Child Growth Standards medians/SDs)
INSERT INTO public.who_growth_standards (sex, age_months, weight_median, weight_sd, height_median, height_sd) VALUES
  ('male',0,3.3,0.4,49.9,1.9),('male',3,6.4,0.7,61.4,2.2),('male',6,7.9,0.9,67.6,2.4),
  ('male',12,9.6,1.1,75.7,2.7),('male',24,12.2,1.4,87.1,3.2),('male',36,14.3,1.6,95.3,3.7),
  ('male',48,16.3,1.9,102.3,4.2),('male',60,18.3,2.2,109.2,4.7),
  ('female',0,3.2,0.4,49.1,1.9),('female',3,5.8,0.7,59.8,2.2),('female',6,7.3,0.9,65.7,2.4),
  ('female',12,8.9,1.1,74.0,2.8),('female',24,11.5,1.4,85.7,3.3),('female',36,13.9,1.6,94.1,3.7),
  ('female',48,16.1,1.9,101.6,4.2),('female',60,18.2,2.2,108.4,4.7);

-- Growth Monitoring
CREATE TABLE public.growth_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  age_months int,
  weight_kg numeric,
  height_cm numeric,
  muac_cm numeric,
  wfa_z numeric,
  hfa_z numeric,
  wfh_z numeric,
  nutrition_status text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_growth_patient ON public.growth_monitoring(child_patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_monitoring TO authenticated;
GRANT ALL ON public.growth_monitoring TO service_role;
ALTER TABLE public.growth_monitoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view growth" ON public.growth_monitoring FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create growth" ON public.growth_monitoring FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update growth" ON public.growth_monitoring FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- Z-score trigger
CREATE OR REPLACE FUNCTION public.calc_growth_zscores()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sex text;
  v_dob date;
  v_lower record;
  v_upper record;
  v_frac numeric;
  v_w_med numeric; v_w_sd numeric;
  v_h_med numeric; v_h_sd numeric;
BEGIN
  -- Resolve hospital_id and sex/dob from patient
  IF NEW.hospital_id IS NULL THEN
    SELECT hospital_id INTO NEW.hospital_id FROM public.patients WHERE id = NEW.child_patient_id;
  END IF;
  SELECT COALESCE(sex_at_birth, gender), date_of_birth INTO v_sex, v_dob FROM public.patients WHERE id = NEW.child_patient_id;
  IF v_sex IS NOT NULL THEN v_sex := lower(v_sex); END IF;
  IF v_sex NOT IN ('male','female') THEN v_sex := 'male'; END IF;
  IF NEW.age_months IS NULL AND v_dob IS NOT NULL THEN
    NEW.age_months := EXTRACT(YEAR FROM age(NEW.visit_date, v_dob)) * 12 + EXTRACT(MONTH FROM age(NEW.visit_date, v_dob));
  END IF;
  IF NEW.age_months IS NULL OR NEW.age_months > 60 OR NEW.age_months < 0 THEN
    RETURN NEW;
  END IF;
  -- Find bracketing reference ages and linearly interpolate
  SELECT * INTO v_lower FROM public.who_growth_standards WHERE sex = v_sex AND age_months <= NEW.age_months ORDER BY age_months DESC LIMIT 1;
  SELECT * INTO v_upper FROM public.who_growth_standards WHERE sex = v_sex AND age_months >= NEW.age_months ORDER BY age_months ASC LIMIT 1;
  IF v_lower IS NULL OR v_upper IS NULL THEN RETURN NEW; END IF;
  IF v_upper.age_months = v_lower.age_months THEN
    v_frac := 0;
  ELSE
    v_frac := (NEW.age_months - v_lower.age_months)::numeric / (v_upper.age_months - v_lower.age_months);
  END IF;
  v_w_med := v_lower.weight_median + v_frac * (v_upper.weight_median - v_lower.weight_median);
  v_w_sd  := v_lower.weight_sd     + v_frac * (v_upper.weight_sd     - v_lower.weight_sd);
  v_h_med := v_lower.height_median + v_frac * (v_upper.height_median - v_lower.height_median);
  v_h_sd  := v_lower.height_sd     + v_frac * (v_upper.height_sd     - v_lower.height_sd);
  IF NEW.weight_kg IS NOT NULL AND v_w_sd > 0 THEN
    NEW.wfa_z := round(((NEW.weight_kg - v_w_med) / v_w_sd)::numeric, 2);
  END IF;
  IF NEW.height_cm IS NOT NULL AND v_h_sd > 0 THEN
    NEW.hfa_z := round(((NEW.height_cm - v_h_med) / v_h_sd)::numeric, 2);
  END IF;
  -- Nutrition status classification by WFA z
  IF NEW.wfa_z IS NOT NULL THEN
    IF NEW.wfa_z < -3 THEN NEW.nutrition_status := 'severe_underweight';
    ELSIF NEW.wfa_z < -2 THEN NEW.nutrition_status := 'underweight';
    ELSIF NEW.wfa_z > 2 THEN NEW.nutrition_status := 'overweight';
    ELSE NEW.nutrition_status := 'normal';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_growth_zscore BEFORE INSERT OR UPDATE ON public.growth_monitoring FOR EACH ROW EXECUTE FUNCTION public.calc_growth_zscores();
