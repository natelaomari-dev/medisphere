
-- Pharmacy: medications inventory
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  dosage_form TEXT NOT NULL DEFAULT 'tablet',
  strength TEXT,
  unit_price NUMERIC(10,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE,
  manufacturer TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update medications" ON public.medications FOR UPDATE TO authenticated USING (true);

-- Prescriptions
CREATE TYPE public.prescription_status AS ENUM ('pending', 'dispensed', 'partially_dispensed', 'cancelled');

CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  medication_id UUID REFERENCES public.medications(id) NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status public.prescription_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  dispensed_by UUID,
  dispensed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
