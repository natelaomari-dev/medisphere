
-- ============================================================
-- FHIR R4 Patient Model Refactor
-- ============================================================

-- 1a. Extend patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS given_names text[],
  ADD COLUMN IF NOT EXISTS family_name text,
  ADD COLUMN IF NOT EXISTS other_names text[],
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS name_script text DEFAULT 'Latn',
  ADD COLUMN IF NOT EXISTS sex_at_birth text,
  ADD COLUMN IF NOT EXISTS gender_identity text,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS occupation_code text,
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country_of_origin text,
  ADD COLUMN IF NOT EXISTS refugee_status text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS is_deceased boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_death date,
  ADD COLUMN IF NOT EXISTS time_of_death time,
  ADD COLUMN IF NOT EXISTS place_of_death text,
  ADD COLUMN IF NOT EXISTS cause_of_death_immediate text,
  ADD COLUMN IF NOT EXISTS cause_of_death_underlying text,
  ADD COLUMN IF NOT EXISTS cause_of_death_contributing text,
  ADD COLUMN IF NOT EXISTS manner_of_death text,
  ADD COLUMN IF NOT EXISTS certifying_doctor_id uuid REFERENCES public.doctors(id);

-- Backfill from existing data
UPDATE public.patients
SET given_names = COALESCE(given_names, string_to_array(first_name, ' ')),
    family_name = COALESCE(family_name, last_name),
    sex_at_birth = COALESCE(sex_at_birth, CASE
      WHEN gender ILIKE 'm%' THEN 'male'
      WHEN gender ILIKE 'f%' THEN 'female'
      WHEN gender ILIKE 'i%' THEN 'intersex'
      ELSE 'unknown'
    END)
WHERE family_name IS NULL OR given_names IS NULL OR sex_at_birth IS NULL;

-- Set NOT NULL + defaults
ALTER TABLE public.patients
  ALTER COLUMN given_names SET DEFAULT '{}',
  ALTER COLUMN given_names SET NOT NULL,
  ALTER COLUMN family_name SET NOT NULL,
  ALTER COLUMN sex_at_birth SET DEFAULT 'unknown',
  ALTER COLUMN sex_at_birth SET NOT NULL;

-- Add CHECK constraints
DO $$ BEGIN
  ALTER TABLE public.patients ADD CONSTRAINT patients_sex_at_birth_check
    CHECK (sex_at_birth IN ('male','female','intersex','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.patients ADD CONSTRAINT patients_marital_status_check
    CHECK (marital_status IS NULL OR marital_status IN ('single','married','cohabiting','widowed','divorced','separated','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.patients ADD CONSTRAINT patients_education_level_check
    CHECK (education_level IS NULL OR education_level IN ('none','primary','secondary','tertiary','postgraduate','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.patients ADD CONSTRAINT patients_refugee_status_check
    CHECK (refugee_status IS NULL OR refugee_status IN ('citizen','refugee','asylum_seeker','stateless','other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.patients ADD CONSTRAINT patients_manner_of_death_check
    CHECK (manner_of_death IS NULL OR manner_of_death IN ('natural','accident','suicide','homicide','undetermined','pending'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sync trigger: family_name <-> last_name, given_names[0] -> first_name
CREATE OR REPLACE FUNCTION public.sync_patient_names()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Family name <-> last_name
  IF NEW.family_name IS NOT NULL AND (NEW.last_name IS NULL OR NEW.last_name = '') THEN
    NEW.last_name := NEW.family_name;
  ELSIF NEW.last_name IS NOT NULL AND (NEW.family_name IS NULL OR NEW.family_name = '') THEN
    NEW.family_name := NEW.last_name;
  END IF;
  -- given_names <-> first_name
  IF NEW.given_names IS NOT NULL AND array_length(NEW.given_names, 1) > 0
     AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
    NEW.first_name := array_to_string(NEW.given_names, ' ');
  ELSIF NEW.first_name IS NOT NULL AND NEW.first_name <> ''
        AND (NEW.given_names IS NULL OR array_length(NEW.given_names, 1) IS NULL) THEN
    NEW.given_names := string_to_array(NEW.first_name, ' ');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_patient_names ON public.patients;
CREATE TRIGGER trg_sync_patient_names
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.sync_patient_names();

-- ============================================================
-- Helper: trigger to copy hospital_id from parent patient
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_hospital_id_from_patient()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.hospital_id IS NULL AND NEW.patient_id IS NOT NULL THEN
    SELECT hospital_id INTO NEW.hospital_id FROM public.patients WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1b. Child tables
-- ============================================================

-- patient_identifiers
CREATE TABLE IF NOT EXISTS public.patient_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type IN ('national_id','passport','birth_notification','birth_certificate','refugee_id','driving_license','sha_number','nhif_number','private_insurance','employer_id','other')),
  identifier_value text NOT NULL,
  identifier_country text,
  is_primary boolean DEFAULT false,
  issued_date date,
  expiry_date date,
  issuing_authority text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_identifiers_one_primary
  ON public.patient_identifiers (patient_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_patient ON public.patient_identifiers(patient_id);

ALTER TABLE public.patient_identifiers ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_identifiers_hospital ON public.patient_identifiers;
CREATE TRIGGER trg_patient_identifiers_hospital BEFORE INSERT ON public.patient_identifiers
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();

CREATE POLICY "Members view patient_identifiers" ON public.patient_identifiers FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_identifiers" ON public.patient_identifiers FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_identifiers" ON public.patient_identifiers FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_contacts
CREATE TABLE IF NOT EXISTS public.patient_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('phone_personal','phone_work','phone_alternate','email_personal','email_work','whatsapp','other')),
  value text NOT NULL,
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  opt_in_sms boolean DEFAULT false,
  opt_in_whatsapp boolean DEFAULT false,
  opt_in_email boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_contacts_patient ON public.patient_contacts(patient_id);
ALTER TABLE public.patient_contacts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_contacts_hospital ON public.patient_contacts;
CREATE TRIGGER trg_patient_contacts_hospital BEFORE INSERT ON public.patient_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_contacts" ON public.patient_contacts FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_contacts" ON public.patient_contacts FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_contacts" ON public.patient_contacts FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_addresses
CREATE TABLE IF NOT EXISTS public.patient_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  address_type text CHECK (address_type IN ('home','work','temporary','postal')),
  country text NOT NULL,
  region text,
  county text,
  sub_county text,
  ward text,
  village text,
  street text,
  building text,
  postal_code text,
  geocoded_lat numeric,
  geocoded_lng numeric,
  is_current boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_addresses_patient ON public.patient_addresses(patient_id);
ALTER TABLE public.patient_addresses ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_addresses_hospital ON public.patient_addresses;
CREATE TRIGGER trg_patient_addresses_hospital BEFORE INSERT ON public.patient_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_addresses" ON public.patient_addresses FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_addresses" ON public.patient_addresses FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_addresses" ON public.patient_addresses FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_relationships
CREATE TABLE IF NOT EXISTS public.patient_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  related_person_name text NOT NULL,
  relationship text CHECK (relationship IN ('spouse','parent','child','sibling','guardian','next_of_kin','financially_responsible','other')),
  is_emergency_contact boolean DEFAULT false,
  is_legal_decision_maker boolean DEFAULT false,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_relationships_patient ON public.patient_relationships(patient_id);
ALTER TABLE public.patient_relationships ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_relationships_hospital ON public.patient_relationships;
CREATE TRIGGER trg_patient_relationships_hospital BEFORE INSERT ON public.patient_relationships
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_relationships" ON public.patient_relationships FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_relationships" ON public.patient_relationships FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_relationships" ON public.patient_relationships FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_allergies
CREATE TABLE IF NOT EXISTS public.patient_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  substance text NOT NULL,
  substance_code text,
  substance_code_system text CHECK (substance_code_system IN ('rxnorm','snomed','atc','other')),
  reaction text,
  severity text CHECK (severity IN ('mild','moderate','severe','life_threatening')),
  onset_date date,
  verified_by uuid REFERENCES auth.users(id),
  verification_date timestamptz,
  status text CHECK (status IN ('active','inactive','resolved')) DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON public.patient_allergies(patient_id);
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_allergies_hospital ON public.patient_allergies;
CREATE TRIGGER trg_patient_allergies_hospital BEFORE INSERT ON public.patient_allergies
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_allergies" ON public.patient_allergies FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_allergies" ON public.patient_allergies FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_allergies" ON public.patient_allergies FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_conditions
CREATE TABLE IF NOT EXISTS public.patient_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  icd_code text NOT NULL,
  icd_description text NOT NULL,
  icd_version text DEFAULT 'ICD-10',
  onset_date date,
  resolved_date date,
  status text CHECK (status IN ('active','resolved','remission','inactive')) DEFAULT 'active',
  severity text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  recorded_date date DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient ON public.patient_conditions(patient_id);
ALTER TABLE public.patient_conditions ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_conditions_hospital ON public.patient_conditions;
CREATE TRIGGER trg_patient_conditions_hospital BEFORE INSERT ON public.patient_conditions
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_conditions" ON public.patient_conditions FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_conditions" ON public.patient_conditions FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_conditions" ON public.patient_conditions FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_social_history
CREATE TABLE IF NOT EXISTS public.patient_social_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  smoking_status text CHECK (smoking_status IN ('never','former','current_light','current_heavy','unknown')),
  pack_years numeric,
  alcohol_use text CHECK (alcohol_use IN ('never','occasional','regular','heavy','unknown')),
  substance_use text,
  household_size int,
  water_source text,
  electricity_access boolean,
  distance_to_facility_km numeric,
  recorded_by uuid,
  recorded_date date DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_social_history_patient ON public.patient_social_history(patient_id);
ALTER TABLE public.patient_social_history ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_social_history_hospital ON public.patient_social_history;
CREATE TRIGGER trg_patient_social_history_hospital BEFORE INSERT ON public.patient_social_history
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_social_history" ON public.patient_social_history FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_social_history" ON public.patient_social_history FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_social_history" ON public.patient_social_history FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- patient_women_health (one per patient)
CREATE TABLE IF NOT EXISTS public.patient_women_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  last_menstrual_period date,
  menarche_age int,
  menopause_age int,
  gravida int,
  parity int,
  abortions int,
  contraception_method text,
  is_pregnant boolean,
  gestational_age_weeks int,
  is_breastfeeding boolean,
  last_updated_by uuid,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_women_health ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_women_health_hospital ON public.patient_women_health;
CREATE TRIGGER trg_patient_women_health_hospital BEFORE INSERT ON public.patient_women_health
  FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_from_patient();
CREATE POLICY "Members view patient_women_health" ON public.patient_women_health FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members create patient_women_health" ON public.patient_women_health FOR INSERT TO authenticated WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members update patient_women_health" ON public.patient_women_health FOR UPDATE TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));

-- updated_at triggers
CREATE TRIGGER trg_patient_identifiers_uat BEFORE UPDATE ON public.patient_identifiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_contacts_uat BEFORE UPDATE ON public.patient_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_addresses_uat BEFORE UPDATE ON public.patient_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_relationships_uat BEFORE UPDATE ON public.patient_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_allergies_uat BEFORE UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_conditions_uat BEFORE UPDATE ON public.patient_conditions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patient_social_history_uat BEFORE UPDATE ON public.patient_social_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 1c. geographic_areas (reference data, all-authenticated read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.geographic_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.geographic_areas(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('country','region','county','sub_county','ward')),
  code text,
  name text NOT NULL,
  country_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_geo_parent ON public.geographic_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_level_country ON public.geographic_areas(level, country_code);
ALTER TABLE public.geographic_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads geo" ON public.geographic_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage geo" ON public.geographic_areas FOR ALL TO authenticated USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));

-- Seed: Kenya + 47 counties
DO $seed$
DECLARE
  v_kenya_id uuid;
  county_record record;
BEGIN
  INSERT INTO public.geographic_areas (level, code, name, country_code)
  VALUES ('country', 'KE', 'Kenya', 'KE')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_kenya_id FROM public.geographic_areas WHERE country_code = 'KE' AND level = 'country' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.geographic_areas WHERE parent_id = v_kenya_id AND level = 'county') THEN
    FOR county_record IN
      SELECT * FROM (VALUES
        ('001','Mombasa'),('002','Kwale'),('003','Kilifi'),('004','Tana River'),('005','Lamu'),
        ('006','Taita-Taveta'),('007','Garissa'),('008','Wajir'),('009','Mandera'),('010','Marsabit'),
        ('011','Isiolo'),('012','Meru'),('013','Tharaka-Nithi'),('014','Embu'),('015','Kitui'),
        ('016','Machakos'),('017','Makueni'),('018','Nyandarua'),('019','Nyeri'),('020','Kirinyaga'),
        ('021','Murang''a'),('022','Kiambu'),('023','Turkana'),('024','West Pokot'),('025','Samburu'),
        ('026','Trans Nzoia'),('027','Uasin Gishu'),('028','Elgeyo-Marakwet'),('029','Nandi'),('030','Baringo'),
        ('031','Laikipia'),('032','Nakuru'),('033','Narok'),('034','Kajiado'),('035','Kericho'),
        ('036','Bomet'),('037','Kakamega'),('038','Vihiga'),('039','Bungoma'),('040','Busia'),
        ('041','Siaya'),('042','Kisumu'),('043','Homa Bay'),('044','Migori'),('045','Kisii'),
        ('046','Nyamira'),('047','Nairobi')
      ) AS t(code,name)
    LOOP
      INSERT INTO public.geographic_areas(parent_id, level, code, name, country_code)
      VALUES (v_kenya_id, 'county', county_record.code, county_record.name, 'KE');
    END LOOP;
  END IF;

  -- Other East African countries (top-level only)
  INSERT INTO public.geographic_areas (level, code, name, country_code) VALUES
    ('country','UG','Uganda','UG'),
    ('country','TZ','Tanzania','TZ'),
    ('country','RW','Rwanda','RW'),
    ('country','BI','Burundi','BI'),
    ('country','SS','South Sudan','SS'),
    ('country','ET','Ethiopia','ET')
  ON CONFLICT DO NOTHING;
END $seed$;

-- ============================================================
-- Migrate legacy patient data into child tables
-- ============================================================

-- Emergency contacts -> patient_relationships
INSERT INTO public.patient_relationships (patient_id, hospital_id, related_person_name, relationship, is_emergency_contact, phone)
SELECT id, hospital_id, emergency_contact_name, 'next_of_kin', true, emergency_contact_phone
FROM public.patients
WHERE emergency_contact_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_relationships pr WHERE pr.patient_id = patients.id AND pr.is_emergency_contact = true
  );

-- Allergies array -> patient_allergies
INSERT INTO public.patient_allergies (patient_id, hospital_id, substance, substance_code_system, status)
SELECT p.id, p.hospital_id, unnest(p.allergies), 'other', 'active'
FROM public.patients p
WHERE p.allergies IS NOT NULL
  AND array_length(p.allergies, 1) > 0
  AND NOT EXISTS (SELECT 1 FROM public.patient_allergies pa WHERE pa.patient_id = p.id);

-- Chronic conditions array -> patient_conditions
INSERT INTO public.patient_conditions (patient_id, hospital_id, icd_code, icd_description, icd_version, status)
SELECT p.id, p.hospital_id, 'UNCODED', unnest(p.chronic_conditions), 'ICD-10', 'active'
FROM public.patients p
WHERE p.chronic_conditions IS NOT NULL
  AND array_length(p.chronic_conditions, 1) > 0
  AND NOT EXISTS (SELECT 1 FROM public.patient_conditions pc WHERE pc.patient_id = p.id);
