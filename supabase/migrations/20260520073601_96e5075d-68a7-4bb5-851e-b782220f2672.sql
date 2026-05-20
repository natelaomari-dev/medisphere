
-- MFA fields on hospital_members
ALTER TABLE public.hospital_members
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_grace_period_end timestamptz;

UPDATE public.hospital_members
SET mfa_required = true,
    mfa_grace_period_end = COALESCE(mfa_grace_period_end, now() + interval '14 days')
WHERE role IN ('admin','doctor','pharmacist');

-- Auto-set mfa_required + grace period for new privileged members
CREATE OR REPLACE FUNCTION public.set_mfa_required_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('admin','doctor','pharmacist') THEN
    NEW.mfa_required := COALESCE(NEW.mfa_required, true);
    IF NEW.mfa_grace_period_end IS NULL THEN
      NEW.mfa_grace_period_end := now() + interval '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_mfa_required ON public.hospital_members;
CREATE TRIGGER trg_set_mfa_required
BEFORE INSERT ON public.hospital_members
FOR EACH ROW EXECUTE FUNCTION public.set_mfa_required_default();

-- patient_consents
CREATE TABLE IF NOT EXISTS public.patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('treatment','data_sharing','ai_processing','photography','research','marketing')),
  status text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','revoked','expired')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  witnessed_by uuid REFERENCES auth.users(id),
  document_url text,
  consent_form_version text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON public.patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_hospital ON public.patient_consents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_type_status ON public.patient_consents(patient_id, consent_type, status);

ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view consents"
  ON public.patient_consents FOR SELECT TO authenticated
  USING (public.is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create consents"
  ON public.patient_consents FOR INSERT TO authenticated
  WITH CHECK (public.is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update consents"
  ON public.patient_consents FOR UPDATE TO authenticated
  USING (public.is_hospital_member(auth.uid(), hospital_id));

CREATE TRIGGER trg_patient_consents_updated_at
BEFORE UPDATE ON public.patient_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_patient_consents_set_hospital
BEFORE INSERT ON public.patient_consents
FOR EACH ROW EXECUTE FUNCTION public.set_hospital_id_default();

-- Storage bucket for consent documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-documents', 'consent-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: <hospital_id>/<patient_id>/<filename>
CREATE POLICY "Hospital members can view consent documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'consent-documents'
    AND public.is_hospital_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Hospital members can upload consent documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consent-documents'
    AND public.is_hospital_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Hospital members can update consent documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'consent-documents'
    AND public.is_hospital_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Hospital members can delete consent documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'consent-documents'
    AND public.is_hospital_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
