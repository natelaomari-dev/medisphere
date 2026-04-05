
-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');

-- Payment method enum  
CREATE TYPE public.payment_method AS ENUM ('cash', 'mpesa', 'card', 'insurance', 'bank_transfer');

-- Insurance claim status enum
CREATE TYPE public.claim_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid', 'appealed');

-- MOH report type enum
CREATE TYPE public.moh_report_type AS ENUM ('moh_705a', 'moh_705b', 'moh_711', 'moh_333', 'moh_406');

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  amount NUMERIC NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_reference TEXT,
  mpesa_receipt_number TEXT,
  mpesa_checkout_request_id TEXT,
  phone_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_payments_hospital ON public.payments(hospital_id);
CREATE INDEX idx_payments_patient ON public.payments(patient_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_mpesa_checkout ON public.payments(mpesa_checkout_request_id);

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insurance claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  invoice_id UUID REFERENCES public.invoices(id),
  claim_number TEXT NOT NULL DEFAULT ('CLM-' || lpad((nextval('patient_id_seq'))::text, 6, '0')),
  sha_member_number TEXT,
  scheme_name TEXT DEFAULT 'SHA',
  diagnosis_codes TEXT[] DEFAULT '{}',
  treatment_description TEXT,
  claim_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  claim_status public.claim_status NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMP WITH TIME ZONE,
  response_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  supporting_documents TEXT[] DEFAULT '{}',
  notes TEXT,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view claims" ON public.insurance_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create claims" ON public.insurance_claims FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update claims" ON public.insurance_claims FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_claims_hospital ON public.insurance_claims(hospital_id);
CREATE INDEX idx_claims_patient ON public.insurance_claims(patient_id);
CREATE INDEX idx_claims_status ON public.insurance_claims(claim_status);

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MOH Reports table
CREATE TABLE public.moh_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  report_type public.moh_report_type NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  submission_status TEXT NOT NULL DEFAULT 'draft',
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moh_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view reports" ON public.moh_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create reports" ON public.moh_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update reports" ON public.moh_reports FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_moh_reports_hospital ON public.moh_reports(hospital_id);
CREATE INDEX idx_moh_reports_type ON public.moh_reports(report_type);

CREATE TRIGGER update_moh_reports_updated_at BEFORE UPDATE ON public.moh_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for payments (for live STK Push status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
