
-- ============ Vault for DHIS2 secrets ============
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ============ DHIS2 facility mappings ============
CREATE TABLE public.dhis2_facility_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL UNIQUE,
  dhis2_org_unit_uid text NOT NULL,
  dhis2_endpoint_url text NOT NULL,
  dhis2_username text,
  dhis2_password_secret_id uuid,  -- vault.secrets.id
  dhis2_instance_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_submission_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dhis2_facility_mappings TO authenticated;
GRANT ALL ON public.dhis2_facility_mappings TO service_role;
ALTER TABLE public.dhis2_facility_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospital admins manage DHIS2 mapping" ON public.dhis2_facility_mappings
  FOR ALL TO authenticated
  USING (is_hospital_admin(auth.uid(), hospital_id))
  WITH CHECK (is_hospital_admin(auth.uid(), hospital_id));
CREATE POLICY "Members can view DHIS2 mapping" ON public.dhis2_facility_mappings
  FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_dhis2_fmap_updated BEFORE UPDATE ON public.dhis2_facility_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DHIS2 data element mappings (per country / report) ============
CREATE TABLE public.dhis2_data_element_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL DEFAULT 'KE',
  report_type text NOT NULL,                   -- e.g. moh_711, moh_705a
  metric_key text NOT NULL,                    -- key in moh_reports.report_data
  dhis2_data_element_uid text NOT NULL,
  dhis2_category_option_combo_uid text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, report_type, metric_key)
);
GRANT SELECT ON public.dhis2_data_element_mappings TO authenticated;
GRANT ALL ON public.dhis2_data_element_mappings TO service_role;
ALTER TABLE public.dhis2_data_element_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read DHIS2 element mappings"
  ON public.dhis2_data_element_mappings FOR SELECT TO authenticated USING (true);

-- ============ MOH reports DHIS2 fields ============
ALTER TABLE public.moh_reports
  ADD COLUMN IF NOT EXISTS dhis2_response jsonb,
  ADD COLUMN IF NOT EXISTS dhis2_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dhis2_attempt_count int NOT NULL DEFAULT 0;

-- ============ Insurance schemes registry ============
CREATE TABLE public.insurance_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  scheme_name text NOT NULL,
  adapter_type text NOT NULL CHECK (adapter_type IN ('sha','nhif_legacy','aar','jubilee','britam','cic','madison','generic')),
  contact_email text,
  contact_phone text,
  account_number text,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, scheme_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_schemes TO authenticated;
GRANT ALL ON public.insurance_schemes TO service_role;
ALTER TABLE public.insurance_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view schemes" ON public.insurance_schemes FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Admins manage schemes" ON public.insurance_schemes FOR ALL TO authenticated
  USING (is_hospital_admin(auth.uid(), hospital_id))
  WITH CHECK (is_hospital_admin(auth.uid(), hospital_id));
CREATE TRIGGER trg_ins_schemes_updated BEFORE UPDATE ON public.insurance_schemes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SHA claim batches ============
CREATE TABLE public.sha_claim_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  scheme_id uuid REFERENCES public.insurance_schemes(id),
  batch_number text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_claims int NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  approved_amount numeric,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  submission_status text NOT NULL DEFAULT 'draft'
    CHECK (submission_status IN ('draft','exported','submitted','reconciled')),
  exported_file_url text,
  exported_file_name text,
  sha_acknowledgement_number text,
  sha_response_file_url text,
  reconciled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, batch_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sha_claim_batches TO authenticated;
GRANT ALL ON public.sha_claim_batches TO service_role;
ALTER TABLE public.sha_claim_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view sha batches" ON public.sha_claim_batches FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members manage sha batches" ON public.sha_claim_batches FOR ALL TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id))
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_sha_batch_updated BEFORE UPDATE ON public.sha_claim_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.insurance_claims
  ADD COLUMN IF NOT EXISTS sha_batch_id uuid REFERENCES public.sha_claim_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_claims_sha_batch ON public.insurance_claims(sha_batch_id);

-- ============ Outbound webhooks ============
CREATE TABLE public.outbound_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  name text NOT NULL,
  target_url text NOT NULL,
  event_types text[] NOT NULL DEFAULT '{}'::text[],
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_delivery_at timestamptz,
  failure_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_webhooks TO authenticated;
GRANT ALL ON public.outbound_webhooks TO service_role;
ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage webhooks" ON public.outbound_webhooks FOR ALL TO authenticated
  USING (is_hospital_admin(auth.uid(), hospital_id))
  WITH CHECK (is_hospital_admin(auth.uid(), hospital_id));
CREATE POLICY "Members view webhooks" ON public.outbound_webhooks FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));
CREATE TRIGGER trg_webhooks_updated BEFORE UPDATE ON public.outbound_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outbound_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.outbound_webhooks(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status int,
  response_body text,
  attempt_count int NOT NULL DEFAULT 1,
  succeeded boolean NOT NULL DEFAULT false,
  error text,
  delivered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outbound_webhook_deliveries TO authenticated;
GRANT ALL ON public.outbound_webhook_deliveries TO service_role;
ALTER TABLE public.outbound_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view webhook deliveries" ON public.outbound_webhook_deliveries
  FOR SELECT TO authenticated USING (is_hospital_member(auth.uid(), hospital_id));
CREATE INDEX idx_webhook_deliveries_webhook ON public.outbound_webhook_deliveries(webhook_id, delivered_at DESC);

-- ============ Seed Kenya MOH 711 data element mappings ============
-- Note: real DHIS2 UIDs must be supplied per deployment from the Kenya HIS DHIS2 metadata.
-- These are placeholder structural mappings; the dhis2-submit function tolerates rows whose UID is 'PENDING'.
INSERT INTO public.dhis2_data_element_mappings (country_code, report_type, metric_key, dhis2_data_element_uid, description) VALUES
('KE','moh_711','opd_new_under5','PENDING','MOH 711: OPD new attendances, under 5 years'),
('KE','moh_711','opd_revisit_under5','PENDING','MOH 711: OPD re-attendances, under 5 years'),
('KE','moh_711','opd_new_over5','PENDING','MOH 711: OPD new attendances, 5 years and above'),
('KE','moh_711','opd_revisit_over5','PENDING','MOH 711: OPD re-attendances, 5 years and above'),
('KE','moh_711','anc_first_visit','PENDING','MOH 711: ANC first visit (any trimester)'),
('KE','moh_711','anc_first_visit_first_trimester','PENDING','MOH 711: ANC first visit before 12 weeks'),
('KE','moh_711','anc_revisit','PENDING','MOH 711: ANC revisits'),
('KE','moh_711','anc_completed_4_visits','PENDING','MOH 711: Mothers completing 4 ANC visits'),
('KE','moh_711','deliveries_skilled_attendant','PENDING','MOH 711: Deliveries conducted by skilled birth attendant'),
('KE','moh_711','deliveries_cs','PENDING','MOH 711: Deliveries by Caesarean section'),
('KE','moh_711','live_births','PENDING','MOH 711: Live births'),
('KE','moh_711','still_births','PENDING','MOH 711: Still births'),
('KE','moh_711','maternal_deaths','PENDING','MOH 711: Maternal deaths in facility'),
('KE','moh_711','postnatal_visit_within_48h','PENDING','MOH 711: Postnatal visit within 48 hours'),
('KE','moh_711','fp_new_users','PENDING','MOH 711: New family planning users'),
('KE','moh_711','fp_revisit','PENDING','MOH 711: FP revisits'),
('KE','moh_711','bcg_under1','PENDING','MOH 711: BCG doses given under 1 year'),
('KE','moh_711','opv0','PENDING','MOH 711: OPV-0 doses'),
('KE','moh_711','penta3','PENDING','MOH 711: Pentavalent 3 doses'),
('KE','moh_711','measles_rubella1','PENDING','MOH 711: Measles-Rubella 1 doses'),
('KE','moh_711','measles_rubella2','PENDING','MOH 711: Measles-Rubella 2 doses'),
('KE','moh_711','hiv_tested','PENDING','MOH 711: HIV tested (total)'),
('KE','moh_711','hiv_positive','PENDING','MOH 711: HIV positive results'),
('KE','moh_711','art_currently_on','PENDING','MOH 711: Patients currently on ART'),
('KE','moh_711','tb_notified','PENDING','MOH 711: TB cases notified'),
('KE','moh_711','tb_cured','PENDING','MOH 711: TB cases cured'),
('KE','moh_711','malaria_confirmed','PENDING','MOH 711: Confirmed malaria cases (any age)'),
('KE','moh_711','malaria_severe','PENDING','MOH 711: Severe malaria cases'),
('KE','moh_711','admissions','PENDING','MOH 711: Total admissions'),
('KE','moh_711','discharges','PENDING','MOH 711: Total discharges'),
('KE','moh_711','deaths','PENDING','MOH 711: In-facility deaths')
ON CONFLICT (country_code, report_type, metric_key) DO NOTHING;

-- ============ Audit & realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.outbound_webhook_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sha_claim_batches;
