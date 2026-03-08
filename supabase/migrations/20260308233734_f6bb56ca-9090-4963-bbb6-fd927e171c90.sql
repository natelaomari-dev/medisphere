
CREATE TYPE public.teleconsult_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.teleconsultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status public.teleconsult_status NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  meeting_link TEXT,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teleconsultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view teleconsultations" ON public.teleconsultations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create teleconsultations" ON public.teleconsultations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update teleconsultations" ON public.teleconsultations FOR UPDATE TO authenticated USING (true);
