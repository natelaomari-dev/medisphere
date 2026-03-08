
-- ICU beds table for tracking patients in ICU with vitals
CREATE TABLE public.icu_beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  bed_number TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  admission_date TIMESTAMP WITH TIME ZONE,
  attending_doctor_id UUID REFERENCES public.doctors(id),
  ventilator BOOLEAN NOT NULL DEFAULT false,
  isolation BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  -- Latest vitals snapshot
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  spo2 INTEGER,
  temperature NUMERIC(4,1),
  respiratory_rate INTEGER,
  gcs_score INTEGER,
  risk_score NUMERIC(4,1),
  last_vitals_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.icu_beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ICU beds" ON public.icu_beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage ICU beds" ON public.icu_beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ICU beds" ON public.icu_beds FOR UPDATE TO authenticated USING (true);

-- Seed some default ICU beds
INSERT INTO public.icu_beds (bed_number) VALUES ('ICU-01'), ('ICU-02'), ('ICU-03'), ('ICU-04'), ('ICU-05'), ('ICU-06'), ('ICU-07'), ('ICU-08');
