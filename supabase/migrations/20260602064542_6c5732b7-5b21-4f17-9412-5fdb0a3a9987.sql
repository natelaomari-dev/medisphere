
CREATE TABLE public.tb_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  registration_number text,
  type text CHECK (type IN ('new','relapse','treatment_after_failure','treatment_after_loss','transfer_in','other')),
  disease_site text CHECK (disease_site IN ('pulmonary','extra_pulmonary')),
  bacteriological_status text,
  hiv_status text,
  regimen text,
  treatment_start_date date,
  treatment_end_date date,
  outcome text CHECK (outcome IN ('cured','treatment_completed','treatment_failed','died','lost_to_followup','not_evaluated','moved')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tb_patient ON public.tb_cases(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tb_cases TO authenticated;
GRANT ALL ON public.tb_cases TO service_role;
ALTER TABLE public.tb_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view tb_cases" ON public.tb_cases FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create tb_cases" ON public.tb_cases FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update tb_cases" ON public.tb_cases FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_tb_set_hospital BEFORE INSERT ON public.tb_cases FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE TRIGGER trg_tb_updated BEFORE UPDATE ON public.tb_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tb_dot_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tb_case_id uuid NOT NULL REFERENCES public.tb_cases(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  doses_taken int DEFAULT 0,
  doses_missed int DEFAULT 0,
  adverse_events text,
  visited_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tb_dot_visits TO authenticated;
GRANT ALL ON public.tb_dot_visits TO service_role;
ALTER TABLE public.tb_dot_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view tb_dot" ON public.tb_dot_visits FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create tb_dot" ON public.tb_dot_visits FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update tb_dot" ON public.tb_dot_visits FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

CREATE OR REPLACE FUNCTION public.set_hospital_id_from_tb_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.hospital_id IS NULL AND NEW.tb_case_id IS NOT NULL THEN
    SELECT hospital_id INTO NEW.hospital_id FROM public.tb_cases WHERE id = NEW.tb_case_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_tb_dot_set_hospital BEFORE INSERT ON public.tb_dot_visits FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_tb_case();

CREATE TABLE public.tb_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tb_case_id uuid NOT NULL REFERENCES public.tb_cases(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  contact_name text NOT NULL,
  relationship text,
  age int,
  screening_date date,
  screening_result text,
  treatment_started boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tb_contacts TO authenticated;
GRANT ALL ON public.tb_contacts TO service_role;
ALTER TABLE public.tb_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view tb_contacts" ON public.tb_contacts FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create tb_contacts" ON public.tb_contacts FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update tb_contacts" ON public.tb_contacts FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_tb_contacts_set_hospital BEFORE INSERT ON public.tb_contacts FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_tb_case();
