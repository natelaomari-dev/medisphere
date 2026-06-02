
-- ============================================
-- Clinical scoring functions
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_news2(
  rr int, spo2 int, on_oxygen bool, temp numeric, sbp int, hr int, consciousness text
) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  s_rr int := 0; s_spo2 int := 0; s_ox int := 0; s_temp int := 0; s_sbp int := 0; s_hr int := 0; s_cons int := 0;
  total int := 0; action text;
BEGIN
  IF rr IS NOT NULL THEN
    IF rr <= 8 OR rr >= 25 THEN s_rr := 3;
    ELSIF rr BETWEEN 21 AND 24 THEN s_rr := 2;
    ELSIF rr BETWEEN 9 AND 11 THEN s_rr := 1;
    END IF;
  END IF;
  IF spo2 IS NOT NULL THEN
    IF spo2 <= 91 THEN s_spo2 := 3;
    ELSIF spo2 BETWEEN 92 AND 93 THEN s_spo2 := 2;
    ELSIF spo2 BETWEEN 94 AND 95 THEN s_spo2 := 1;
    END IF;
  END IF;
  IF on_oxygen THEN s_ox := 2; END IF;
  IF temp IS NOT NULL THEN
    IF temp <= 35.0 OR temp >= 39.1 THEN s_temp := 3;
    ELSIF temp BETWEEN 38.1 AND 39.0 THEN s_temp := 1;
    ELSIF temp BETWEEN 35.1 AND 36.0 THEN s_temp := 1;
    END IF;
  END IF;
  IF sbp IS NOT NULL THEN
    IF sbp <= 90 OR sbp >= 220 THEN s_sbp := 3;
    ELSIF sbp BETWEEN 91 AND 100 THEN s_sbp := 2;
    ELSIF sbp BETWEEN 101 AND 110 THEN s_sbp := 1;
    END IF;
  END IF;
  IF hr IS NOT NULL THEN
    IF hr <= 40 OR hr >= 131 THEN s_hr := 3;
    ELSIF hr BETWEEN 111 AND 130 THEN s_hr := 2;
    ELSIF (hr BETWEEN 41 AND 50) OR (hr BETWEEN 91 AND 110) THEN s_hr := 1;
    END IF;
  END IF;
  IF consciousness IS NOT NULL AND lower(consciousness) <> 'alert' THEN s_cons := 3; END IF;
  total := s_rr + s_spo2 + s_ox + s_temp + s_sbp + s_hr + s_cons;
  IF total >= 7 THEN action := 'Emergency assessment by critical care team; continuous monitoring';
  ELSIF total >= 5 THEN action := 'Urgent review by clinician; minimum hourly monitoring';
  ELSIF total >= 1 THEN action := 'Ward-based response; minimum 4-6 hourly monitoring';
  ELSE action := 'Routine 12-hourly monitoring';
  END IF;
  RETURN jsonb_build_object(
    'score', total,
    'action', action,
    'components', jsonb_build_object('rr',s_rr,'spo2',s_spo2,'on_oxygen',s_ox,'temp',s_temp,'sbp',s_sbp,'hr',s_hr,'consciousness',s_cons)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_qsofa(rr int, sbp int, consciousness text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE total int := 0;
BEGIN
  IF rr IS NOT NULL AND rr >= 22 THEN total := total + 1; END IF;
  IF sbp IS NOT NULL AND sbp <= 100 THEN total := total + 1; END IF;
  IF consciousness IS NOT NULL AND lower(consciousness) <> 'alert' THEN total := total + 1; END IF;
  RETURN jsonb_build_object('score', total, 'action',
    CASE WHEN total >= 2 THEN 'High risk of sepsis - urgent senior review and sepsis bundle' ELSE 'Low qSOFA - reassess if clinical concern' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_mews(rr int, hr int, sbp int, temp numeric, consciousness text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s_rr int := 0; s_hr int := 0; s_sbp int := 0; s_temp int := 0; s_cons int := 0; total int;
BEGIN
  IF rr IS NOT NULL THEN
    IF rr < 9 OR rr >= 30 THEN s_rr := 3;
    ELSIF rr BETWEEN 21 AND 29 THEN s_rr := 2;
    ELSIF rr BETWEEN 15 AND 20 THEN s_rr := 1;
    ELSIF rr BETWEEN 9 AND 14 THEN s_rr := 0;
    END IF;
  END IF;
  IF hr IS NOT NULL THEN
    IF hr < 40 OR hr > 130 THEN s_hr := 3;
    ELSIF hr BETWEEN 111 AND 130 THEN s_hr := 2;
    ELSIF (hr BETWEEN 41 AND 50) OR (hr BETWEEN 101 AND 110) THEN s_hr := 1;
    END IF;
  END IF;
  IF sbp IS NOT NULL THEN
    IF sbp < 70 OR sbp > 200 THEN s_sbp := 3;
    ELSIF sbp BETWEEN 71 AND 80 THEN s_sbp := 2;
    ELSIF sbp BETWEEN 81 AND 100 THEN s_sbp := 1;
    END IF;
  END IF;
  IF temp IS NOT NULL THEN
    IF temp < 35 THEN s_temp := 2;
    ELSIF temp >= 38.5 THEN s_temp := 2;
    ELSIF temp >= 37.5 THEN s_temp := 1;
    END IF;
  END IF;
  IF consciousness IS NOT NULL AND lower(consciousness) <> 'alert' THEN s_cons := 2; END IF;
  total := s_rr + s_hr + s_sbp + s_temp + s_cons;
  RETURN jsonb_build_object('score', total, 'action',
    CASE WHEN total >= 5 THEN 'Urgent obstetric review; consider HDU/ICU' WHEN total >= 3 THEN 'Senior midwife review' ELSE 'Routine observation' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_pews(rr int, hr int, spo2 int, consciousness text, age_months int)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s_rr int := 0; s_hr int := 0; s_spo2 int := 0; s_cons int := 0; total int;
BEGIN
  -- Simplified Brighton PEWS
  IF rr IS NOT NULL THEN
    IF rr > 60 OR rr < 10 THEN s_rr := 3;
    ELSIF rr > 40 OR rr < 15 THEN s_rr := 2;
    ELSIF rr > 30 THEN s_rr := 1;
    END IF;
  END IF;
  IF hr IS NOT NULL THEN
    IF hr > 170 OR hr < 60 THEN s_hr := 3;
    ELSIF hr > 150 THEN s_hr := 2;
    ELSIF hr > 130 THEN s_hr := 1;
    END IF;
  END IF;
  IF spo2 IS NOT NULL THEN
    IF spo2 < 90 THEN s_spo2 := 3;
    ELSIF spo2 < 94 THEN s_spo2 := 2;
    END IF;
  END IF;
  IF consciousness IS NOT NULL AND lower(consciousness) NOT IN ('alert','playing') THEN s_cons := 3; END IF;
  total := s_rr + s_hr + s_spo2 + s_cons;
  RETURN jsonb_build_object('score', total, 'action',
    CASE WHEN total >= 5 THEN 'Critical - urgent paediatric review' WHEN total >= 3 THEN 'Worrying trend - paediatric review' ELSE 'Routine' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_gcs(eye int, verbal int, motor int)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE total int;
BEGIN
  total := COALESCE(eye,0) + COALESCE(verbal,0) + COALESCE(motor,0);
  RETURN jsonb_build_object('score', total, 'action',
    CASE WHEN total <= 8 THEN 'Severe - consider intubation, neurosurgical referral'
         WHEN total <= 12 THEN 'Moderate brain injury - imaging and close monitoring'
         ELSE 'Mild' END);
END;
$$;

-- Clinical scores table
CREATE TABLE public.clinical_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  encounter_id uuid,
  score_type text NOT NULL,
  score_value numeric NOT NULL,
  components jsonb,
  action_recommended text,
  calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinscore_pt ON public.clinical_scores(patient_id, score_type, calculated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_scores TO authenticated;
GRANT ALL ON public.clinical_scores TO service_role;
ALTER TABLE public.clinical_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view scores" ON public.clinical_scores FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create scores" ON public.clinical_scores FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

-- Auto-compute NEWS2 on new vitals
CREATE OR REPLACE FUNCTION public.compute_score_on_vitals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result jsonb;
  v_score int;
  v_dob date;
  v_age_years int;
BEGIN
  v_result := public.calculate_news2(
    NEW.respiratory_rate, NEW.spo2, false, NEW.temperature,
    NEW.blood_pressure_systolic, NEW.heart_rate, 'alert'
  );
  v_score := (v_result->>'score')::int;

  INSERT INTO public.clinical_scores (patient_id, hospital_id, encounter_id, score_type, score_value, components, action_recommended)
  VALUES (NEW.patient_id, NEW.hospital_id, NEW.medical_record_id, 'NEWS2', v_score,
          v_result->'components', v_result->>'action');

  IF v_score >= 7 THEN
    INSERT INTO public.ai_alerts (hospital_id, patient_id, alert_type, severity, title, message, confidence)
    VALUES (NEW.hospital_id, NEW.patient_id, 'deterioration', 'critical'::risk_level,
            'Critical NEWS2 score (' || v_score || ')',
            'Patient NEWS2 ' || v_score || ' on latest vitals. ' || (v_result->>'action'),
            0.95);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_vitals_score AFTER INSERT ON public.vitals FOR EACH ROW EXECUTE FUNCTION public.compute_score_on_vitals();

-- ============================================
-- Order Sets
-- ============================================

CREATE TABLE public.order_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid,
  name text NOT NULL,
  category text,
  description text,
  clinical_pathway text,
  is_template boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_sets TO authenticated;
GRANT ALL ON public.order_sets TO service_role;
ALTER TABLE public.order_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View order_sets templates or own" ON public.order_sets FOR SELECT TO authenticated
  USING (is_template = true OR (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id)));
CREATE POLICY "Members create order_sets" ON public.order_sets FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update own order_sets" ON public.order_sets FOR UPDATE TO authenticated
  USING (hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON public.order_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_set_id uuid NOT NULL REFERENCES public.order_sets(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('medication','lab','imaging','procedure','nursing_instruction','diet')),
  item_data jsonb NOT NULL,
  sequence int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_osi_set ON public.order_set_items(order_set_id, sequence);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_set_items TO authenticated;
GRANT ALL ON public.order_set_items TO service_role;
ALTER TABLE public.order_set_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View order_set_items via parent" ON public.order_set_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.order_sets os WHERE os.id = order_set_id
    AND (os.is_template = true OR (os.hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), os.hospital_id)))));
CREATE POLICY "Manage order_set_items via parent" ON public.order_set_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.order_sets os WHERE os.id = order_set_id
    AND os.hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), os.hospital_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.order_sets os WHERE os.id = order_set_id
    AND os.hospital_id IS NOT NULL AND is_hospital_member(auth.uid(), os.hospital_id)));

-- Seed 10 high-value order set templates
DO $$
DECLARE v_id uuid;
BEGIN
  -- 1. Sepsis admission bundle
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Sepsis Admission Bundle','Critical Care','Sepsis 1-hour bundle for suspected sepsis','Surviving Sepsis Campaign',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Blood culture x2','priority','stat','test_category','microbiology'),1),
    (v_id,'lab',jsonb_build_object('test_name','Lactate','priority','stat','test_category','chemistry'),2),
    (v_id,'lab',jsonb_build_object('test_name','Full blood count','priority','stat','test_category','haematology'),3),
    (v_id,'lab',jsonb_build_object('test_name','Urea, electrolytes & creatinine','priority','stat','test_category','chemistry'),4),
    (v_id,'medication',jsonb_build_object('name','Ceftriaxone','dose','2g IV stat','frequency','OD','route','IV'),5),
    (v_id,'medication',jsonb_build_object('name','Normal saline','dose','30 mL/kg bolus','route','IV'),6),
    (v_id,'nursing_instruction',jsonb_build_object('text','Hourly vitals; urine output monitoring; NEWS2 hourly'),7),
    (v_id,'nursing_instruction',jsonb_build_object('text','Oxygen to target SpO2 94-98%'),8);

  -- 2. DKA Management
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('DKA Management','Endocrine','Diabetic ketoacidosis treatment protocol','JBDS-IP DKA Guideline',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Capillary blood glucose','priority','stat'),1),
    (v_id,'lab',jsonb_build_object('test_name','Venous blood gas','priority','stat'),2),
    (v_id,'lab',jsonb_build_object('test_name','Urine ketones','priority','stat'),3),
    (v_id,'lab',jsonb_build_object('test_name','U&E + creatinine','priority','stat'),4),
    (v_id,'medication',jsonb_build_object('name','Normal saline 0.9%','dose','1L over 1h then titrate','route','IV'),5),
    (v_id,'medication',jsonb_build_object('name','Insulin (Actrapid)','dose','0.1 units/kg/hr infusion','route','IV'),6),
    (v_id,'medication',jsonb_build_object('name','Potassium chloride','dose','per local protocol when K<5.5','route','IV'),7),
    (v_id,'nursing_instruction',jsonb_build_object('text','Hourly capillary glucose and ketones; strict I/O chart'),8);

  -- 3. Severe Malaria
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Severe Malaria','Infectious Disease','WHO severe malaria management','WHO Malaria Guideline 2024',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Malaria RDT + thick/thin film','priority','stat'),1),
    (v_id,'lab',jsonb_build_object('test_name','FBC, U&E, glucose, lactate','priority','stat'),2),
    (v_id,'medication',jsonb_build_object('name','Artesunate IV','dose','2.4 mg/kg at 0, 12, 24h then OD','route','IV'),3),
    (v_id,'medication',jsonb_build_object('name','Dextrose 10%','dose','PRN if BG<3','route','IV'),4),
    (v_id,'nursing_instruction',jsonb_build_object('text','GCS hourly; monitor for hypoglycaemia; cooling measures'),5);

  -- 4. Normal Labor
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Normal Labor Admission','Obstetrics','Routine labor admission orders','WHO Labor Care Guide',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Hb, blood group, HIV, VDRL','priority','routine'),1),
    (v_id,'nursing_instruction',jsonb_build_object('text','Partograph; FHR every 30min in 1st stage; vitals 4-hourly'),2),
    (v_id,'medication',jsonb_build_object('name','IV cannula + RL TKVO','route','IV'),3),
    (v_id,'diet',jsonb_build_object('text','Light diet as tolerated; clear fluids in active labor'),4);

  -- 5. Post-op cholecystectomy
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Post-op Cholecystectomy','Surgery','Routine post-laparoscopic cholecystectomy orders',NULL,true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'medication',jsonb_build_object('name','Paracetamol','dose','1g QDS','route','PO/IV'),1),
    (v_id,'medication',jsonb_build_object('name','Diclofenac','dose','50mg TDS','route','PO'),2),
    (v_id,'medication',jsonb_build_object('name','Ondansetron','dose','4mg PRN','route','IV'),3),
    (v_id,'medication',jsonb_build_object('name','Enoxaparin','dose','40mg OD','route','SC'),4),
    (v_id,'nursing_instruction',jsonb_build_object('text','Early ambulation; remove catheter at 6h; wound check'),5),
    (v_id,'diet',jsonb_build_object('text','Free fluids then light diet'),6);

  -- 6. Acute MI
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Acute Myocardial Infarction','Cardiology','STEMI/NSTEMI initial management','ESC ACS Guideline',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Troponin I (0h and 3h)','priority','stat'),1),
    (v_id,'lab',jsonb_build_object('test_name','12-lead ECG','priority','stat'),2),
    (v_id,'medication',jsonb_build_object('name','Aspirin','dose','300mg loading then 75mg OD','route','PO'),3),
    (v_id,'medication',jsonb_build_object('name','Clopidogrel','dose','300mg loading then 75mg OD','route','PO'),4),
    (v_id,'medication',jsonb_build_object('name','Atorvastatin','dose','80mg OD','route','PO'),5),
    (v_id,'medication',jsonb_build_object('name','GTN spray PRN','route','SL'),6),
    (v_id,'nursing_instruction',jsonb_build_object('text','Continuous cardiac monitoring; O2 if SpO2<94%; refer cath lab if STEMI'),7);

  -- 7. Pediatric pneumonia
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Pediatric Pneumonia','Pediatrics','WHO IMCI severe pneumonia','WHO IMCI',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Chest X-ray, FBC, malaria RDT','priority','urgent'),1),
    (v_id,'medication',jsonb_build_object('name','Amoxicillin','dose','40 mg/kg BD','route','PO'),2),
    (v_id,'medication',jsonb_build_object('name','Benzylpenicillin','dose','50,000 IU/kg QDS','route','IV'),3),
    (v_id,'medication',jsonb_build_object('name','Gentamicin','dose','7.5 mg/kg OD','route','IV'),4),
    (v_id,'nursing_instruction',jsonb_build_object('text','O2 to maintain SpO2 >= 90%; feeding support; PEWS every 4h'),5);

  -- 8. Pre-eclampsia
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Severe Pre-eclampsia','Obstetrics','MgSO4 prophylaxis and BP control','WHO PE/E Guideline',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','FBC, U&E, LFT, urate, urine protein','priority','stat'),1),
    (v_id,'medication',jsonb_build_object('name','Magnesium sulfate','dose','4g IV loading + 5g IM each buttock, then 5g IM q4h x 24h','route','IV/IM'),2),
    (v_id,'medication',jsonb_build_object('name','Labetalol','dose','20mg IV bolus, repeat','route','IV'),3),
    (v_id,'medication',jsonb_build_object('name','Nifedipine','dose','10mg PO','route','PO'),4),
    (v_id,'nursing_instruction',jsonb_build_object('text','Strict I/O; reflexes; respiratory rate before each MgSO4 dose; FHR monitoring'),5);

  -- 9. Snakebite
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Snakebite Envenomation','Emergency','Initial management of snakebite',NULL,true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','20-min WBCT, FBC, U&E, urinalysis','priority','stat'),1),
    (v_id,'medication',jsonb_build_object('name','Polyvalent antivenom','dose','10 vials in 250mL NS over 1h','route','IV'),2),
    (v_id,'medication',jsonb_build_object('name','Tetanus toxoid','dose','0.5mL','route','IM'),3),
    (v_id,'medication',jsonb_build_object('name','Adrenaline 1:1000','dose','0.5mg IM PRN anaphylaxis','route','IM'),4),
    (v_id,'nursing_instruction',jsonb_build_object('text','Immobilise limb; mark bite margin; monitor for ptosis, bleeding, oliguria'),5);

  -- 10. SAM
  INSERT INTO public.order_sets (name, category, description, clinical_pathway, is_template) VALUES
    ('Severe Acute Malnutrition','Pediatrics','Inpatient SAM management','WHO SAM Guideline',true) RETURNING id INTO v_id;
  INSERT INTO public.order_set_items (order_set_id, item_type, item_data, sequence) VALUES
    (v_id,'lab',jsonb_build_object('test_name','Blood glucose, HIV test, malaria RDT','priority','stat'),1),
    (v_id,'medication',jsonb_build_object('name','Amoxicillin','dose','15 mg/kg TDS x 5d','route','PO'),2),
    (v_id,'medication',jsonb_build_object('name','Vitamin A','dose','age-appropriate dose','route','PO'),3),
    (v_id,'medication',jsonb_build_object('name','Folic acid','dose','5mg day 1 then 1mg OD','route','PO'),4),
    (v_id,'diet',jsonb_build_object('text','F-75 stabilisation feeds, transition to F-100 / RUTF in rehabilitation'),5),
    (v_id,'nursing_instruction',jsonb_build_object('text','Keep warm; monitor for hypoglycaemia/hypothermia; cautious rehydration with ReSoMal'),6);
END $$;
