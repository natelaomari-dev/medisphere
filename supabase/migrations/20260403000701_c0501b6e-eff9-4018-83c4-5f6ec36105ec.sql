
-- =============================================
-- EMR MODULE: Medical Records
-- =============================================
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID REFERENCES public.doctors(id),
  hospital_id UUID REFERENCES public.hospitals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  visit_type TEXT NOT NULL DEFAULT 'outpatient' CHECK (visit_type IN ('outpatient', 'inpatient', 'emergency')),
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  past_medical_history TEXT,
  physical_examination TEXT,
  assessment TEXT,
  treatment_plan TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'signed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view medical records" ON public.medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create medical records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update medical records" ON public.medical_records FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_hospital ON public.medical_records(hospital_id);
CREATE INDEX idx_medical_records_doctor ON public.medical_records(doctor_id);

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- EMR MODULE: Diagnoses (ICD-10)
-- =============================================
CREATE TABLE public.diagnoses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id),
  icd_code TEXT NOT NULL,
  icd_description TEXT NOT NULL,
  diagnosis_type TEXT NOT NULL DEFAULT 'primary' CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create diagnoses" ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update diagnoses" ON public.diagnoses FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_diagnoses_medical_record ON public.diagnoses(medical_record_id);
CREATE INDEX idx_diagnoses_icd_code ON public.diagnoses(icd_code);

-- =============================================
-- EMR MODULE: Vitals
-- =============================================
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  medical_record_id UUID REFERENCES public.medical_records(id),
  hospital_id UUID REFERENCES public.hospitals(id),
  recorded_by UUID,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature NUMERIC(4,1),
  respiratory_rate INTEGER,
  spo2 INTEGER,
  weight NUMERIC(5,1),
  height NUMERIC(5,1),
  bmi NUMERIC(4,1),
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vitals" ON public.vitals FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_vitals_patient ON public.vitals(patient_id);
CREATE INDEX idx_vitals_medical_record ON public.vitals(medical_record_id);

-- =============================================
-- INPATIENT MODULE: Wards
-- =============================================
CREATE TABLE public.wards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  name TEXT NOT NULL,
  ward_type TEXT NOT NULL DEFAULT 'general' CHECK (ward_type IN ('general', 'maternity', 'paediatric', 'surgical', 'icu', 'isolation', 'private')),
  floor TEXT,
  total_beds INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view wards" ON public.wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create wards" ON public.wards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update wards" ON public.wards FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_wards_hospital ON public.wards(hospital_id);

CREATE TRIGGER update_wards_updated_at BEFORE UPDATE ON public.wards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INPATIENT MODULE: Beds
-- =============================================
CREATE TABLE public.beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ward_id UUID NOT NULL REFERENCES public.wards(id),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  bed_number TEXT NOT NULL,
  bed_type TEXT NOT NULL DEFAULT 'standard' CHECK (bed_type IN ('standard', 'electric', 'cot', 'crib')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update beds" ON public.beds FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_beds_ward ON public.beds(ward_id);
CREATE INDEX idx_beds_hospital ON public.beds(hospital_id);

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INPATIENT MODULE: Admissions
-- =============================================
CREATE TYPE public.admission_status AS ENUM ('admitted', 'discharged', 'transferred', 'deceased');

CREATE TABLE public.admissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  bed_id UUID REFERENCES public.beds(id),
  ward_id UUID NOT NULL REFERENCES public.wards(id),
  admitting_doctor_id UUID REFERENCES public.doctors(id),
  attending_doctor_id UUID REFERENCES public.doctors(id),
  admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_discharge_date TIMESTAMPTZ,
  actual_discharge_date TIMESTAMPTZ,
  admission_reason TEXT NOT NULL,
  admission_type TEXT NOT NULL DEFAULT 'elective' CHECK (admission_type IN ('emergency', 'elective', 'transfer')),
  status admission_status NOT NULL DEFAULT 'admitted',
  discharge_summary TEXT,
  discharge_diagnosis TEXT,
  discharged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view admissions" ON public.admissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create admissions" ON public.admissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update admissions" ON public.admissions FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_admissions_patient ON public.admissions(patient_id);
CREATE INDEX idx_admissions_hospital ON public.admissions(hospital_id);
CREATE INDEX idx_admissions_ward ON public.admissions(ward_id);
CREATE INDEX idx_admissions_status ON public.admissions(status);

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INPATIENT MODULE: Nurse Notes
-- =============================================
CREATE TABLE public.nurse_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL REFERENCES public.admissions(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  nurse_id UUID,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('observation', 'medication', 'procedure', 'handover', 'general')),
  content TEXT NOT NULL,
  vitals_snapshot JSONB DEFAULT '{}'::jsonb,
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nurse_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view nurse notes" ON public.nurse_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create nurse notes" ON public.nurse_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update nurse notes" ON public.nurse_notes FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_nurse_notes_admission ON public.nurse_notes(admission_id);
CREATE INDEX idx_nurse_notes_patient ON public.nurse_notes(patient_id);
