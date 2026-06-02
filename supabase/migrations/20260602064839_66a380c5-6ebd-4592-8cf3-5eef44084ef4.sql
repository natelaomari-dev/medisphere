
CREATE TABLE public.notifiable_conditions_registry (
  id text PRIMARY KEY,
  condition_name text NOT NULL,
  icd_codes text[] NOT NULL DEFAULT '{}',
  notification_window_hours int NOT NULL DEFAULT 24,
  requires_immediate boolean NOT NULL DEFAULT false,
  reporting_form text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifiable_conditions_registry TO authenticated, anon;
GRANT ALL ON public.notifiable_conditions_registry TO service_role;
ALTER TABLE public.notifiable_conditions_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads idsr registry" ON public.notifiable_conditions_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage idsr registry" ON public.notifiable_conditions_registry FOR ALL TO authenticated USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

INSERT INTO public.notifiable_conditions_registry (id, condition_name, icd_codes, notification_window_hours, requires_immediate, reporting_form) VALUES
  ('cholera','Cholera', ARRAY['A00','A00.0','A00.1','A00.9'], 24, true, 'IDSR-001'),
  ('measles','Measles', ARRAY['B05','B05.0','B05.1','B05.2','B05.3','B05.4','B05.8','B05.9'], 24, true, 'IDSR-001'),
  ('polio','Acute Flaccid Paralysis / Polio', ARRAY['A80','A80.0','A80.1','A80.2','A80.3','A80.4','A80.9','G04.0'], 24, true, 'IDSR-001'),
  ('ebola','Ebola Virus Disease', ARRAY['A98.4'], 24, true, 'IDSR-001'),
  ('marburg','Marburg Virus Disease', ARRAY['A98.3'], 24, true, 'IDSR-001'),
  ('mpox','Mpox (Monkeypox)', ARRAY['B04'], 24, true, 'IDSR-001'),
  ('covid19','COVID-19', ARRAY['U07.1','U07.2','U09.9'], 24, false, 'IDSR-001'),
  ('diphtheria','Diphtheria', ARRAY['A36','A36.0','A36.1','A36.2','A36.3','A36.8','A36.9'], 24, true, 'IDSR-001'),
  ('neonatal_tetanus','Neonatal Tetanus', ARRAY['A33'], 24, true, 'IDSR-001'),
  ('maternal_death','Maternal Death', ARRAY['O95','O96','O97'], 24, true, 'IDSR-MDR'),
  ('perinatal_death','Perinatal Death', ARRAY['P95','P96.9'], 168, false, 'IDSR-PDR'),
  ('rabies','Rabies', ARRAY['A82','A82.0','A82.1','A82.9'], 24, true, 'IDSR-001'),
  ('meningococcal','Meningococcal Meningitis', ARRAY['A39','A39.0','A39.1','A39.2','A39.3','A39.4','A39.5','A39.8','A39.9'], 24, true, 'IDSR-001'),
  ('yellow_fever','Yellow Fever', ARRAY['A95','A95.0','A95.1','A95.9'], 24, true, 'IDSR-001'),
  ('plague','Plague', ARRAY['A20','A20.0','A20.1','A20.2','A20.3','A20.7','A20.8','A20.9'], 24, true, 'IDSR-001');

CREATE TABLE public.idsr_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  hospital_id uuid NOT NULL,
  condition_id text REFERENCES public.notifiable_conditions_registry(id),
  diagnosed_date date NOT NULL DEFAULT CURRENT_DATE,
  notified_date timestamptz,
  notification_method text,
  notified_by uuid,
  recipient_authority text,
  response_received boolean DEFAULT false,
  response_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','acknowledged','closed')),
  source_diagnosis_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_idsr_status ON public.idsr_notifications(hospital_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idsr_notifications TO authenticated;
GRANT ALL ON public.idsr_notifications TO service_role;
ALTER TABLE public.idsr_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view idsr" ON public.idsr_notifications FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create idsr" ON public.idsr_notifications FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update idsr" ON public.idsr_notifications FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_idsr_updated BEFORE UPDATE ON public.idsr_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on diagnoses: scan for notifiable ICD codes
CREATE OR REPLACE FUNCTION public.check_notifiable_diagnosis()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cond record;
  v_patient_id uuid;
BEGIN
  SELECT patient_id INTO v_patient_id FROM public.medical_records WHERE id = NEW.medical_record_id;
  FOR v_cond IN SELECT * FROM public.notifiable_conditions_registry WHERE NEW.icd_code = ANY(icd_codes) LOOP
    INSERT INTO public.idsr_notifications (patient_id, hospital_id, condition_id, diagnosed_date, source_diagnosis_id, status)
    VALUES (v_patient_id, NEW.hospital_id, v_cond.id, CURRENT_DATE, NEW.id, 'pending');

    INSERT INTO public.ai_alerts (hospital_id, patient_id, alert_type, severity, title, message, confidence)
    VALUES (
      NEW.hospital_id, v_patient_id,
      'notifiable_disease',
      CASE WHEN v_cond.requires_immediate THEN 'critical'::risk_level ELSE 'high'::risk_level END,
      'Notifiable disease: ' || v_cond.condition_name,
      'Diagnosis ' || NEW.icd_code || ' (' || NEW.icd_description || ') is a notifiable condition. Submit ' ||
        COALESCE(v_cond.reporting_form,'IDSR') || ' within ' || v_cond.notification_window_hours || ' hours.',
      1.0
    );
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dx_notifiable AFTER INSERT ON public.diagnoses FOR EACH ROW EXECUTE FUNCTION public.check_notifiable_diagnosis();
