
-- Lab order status enum
CREATE TYPE public.lab_order_status AS ENUM ('pending', 'sample_collected', 'processing', 'completed', 'cancelled');

-- Lab orders table
CREATE TABLE public.lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  ordered_by UUID NOT NULL,
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'routine',
  status public.lab_order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  result_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lab orders" ON public.lab_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create lab orders" ON public.lab_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lab orders" ON public.lab_orders FOR UPDATE TO authenticated USING (true);
