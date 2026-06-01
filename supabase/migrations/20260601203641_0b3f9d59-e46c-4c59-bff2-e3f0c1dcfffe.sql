
-- HIV enrollments
CREATE TABLE public.hiv_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  ccc_number text UNIQUE,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  who_stage int CHECK (who_stage BETWEEN 1 AND 4),
  baseline_cd4 int,
  baseline_vl int,
  art_eligible boolean DEFAULT true,
  partner_testing_done boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiv_enrollments TO authenticated;
GRANT ALL ON public.hiv_enrollments TO service_role;
ALTER TABLE public.hiv_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view hiv_enroll" ON public.hiv_enrollments FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create hiv_enroll" ON public.hiv_enrollments FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update hiv_enroll" ON public.hiv_enrollments FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_hiv_enroll_set_hospital BEFORE INSERT ON public.hiv_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE TRIGGER trg_hiv_enroll_updated BEFORE UPDATE ON public.hiv_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ART regimens
CREATE TABLE public.art_regimens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  regimen_code text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  reason_for_change text,
  prescribed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_art_reg_patient ON public.art_regimens(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.art_regimens TO authenticated;
GRANT ALL ON public.art_regimens TO service_role;
ALTER TABLE public.art_regimens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view art_reg" ON public.art_regimens FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create art_reg" ON public.art_regimens FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update art_reg" ON public.art_regimens FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_art_reg_set_hospital BEFORE INSERT ON public.art_regimens FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();

-- Viral load results
CREATE TABLE public.viral_load_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  sample_date date NOT NULL,
  result_date date,
  copies_per_ml int,
  undetectable boolean,
  suppressed boolean,
  lab_facility text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vl_patient ON public.viral_load_results(patient_id, sample_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viral_load_results TO authenticated;
GRANT ALL ON public.viral_load_results TO service_role;
ALTER TABLE public.viral_load_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view vl" ON public.viral_load_results FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create vl" ON public.viral_load_results FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update vl" ON public.viral_load_results FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_vl_set_hospital BEFORE INSERT ON public.viral_load_results FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();

-- ART dispenses
CREATE TABLE public.art_dispenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  dispense_date date NOT NULL DEFAULT CURRENT_DATE,
  regimen_code text,
  pills_dispensed int,
  days_supplied int,
  next_appointment date,
  dispensed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_art_disp_patient ON public.art_dispenses(patient_id, dispense_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.art_dispenses TO authenticated;
GRANT ALL ON public.art_dispenses TO service_role;
ALTER TABLE public.art_dispenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view art_disp" ON public.art_dispenses FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create art_disp" ON public.art_dispenses FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update art_disp" ON public.art_dispenses FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_art_disp_set_hospital BEFORE INSERT ON public.art_dispenses FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
