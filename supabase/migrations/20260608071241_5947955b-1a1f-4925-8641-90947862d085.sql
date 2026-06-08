
-- ============================================================
-- NOTIFICATION TEMPLATES
-- ============================================================
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email')),
  language text NOT NULL DEFAULT 'en',
  subject text,
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_notification_templates ON public.notification_templates(COALESCE(hospital_id, '00000000-0000-0000-0000-000000000000'::uuid), template_key, channel, language);
CREATE INDEX idx_notif_templates_key ON public.notification_templates(template_key, channel, language);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read templates" ON public.notification_templates FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Admins manage hospital templates" ON public.notification_templates FOR ALL TO authenticated
  USING (hospital_id IS NOT NULL AND public.is_hospital_admin(auth.uid(), hospital_id))
  WITH CHECK (hospital_id IS NOT NULL AND public.is_hospital_admin(auth.uid(), hospital_id));

CREATE TRIGGER trg_notif_templates_updated BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- NOTIFICATION QUEUE
-- ============================================================
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email')),
  template_key text NOT NULL,
  language text DEFAULT 'en',
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_subject text,
  rendered_body text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','delivered','failed')),
  provider text,
  provider_message_id text,
  error_message text,
  attempt_count int NOT NULL DEFAULT 0,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_queue_due ON public.notification_queue(status, scheduled_for) WHERE status IN ('pending','sending');
CREATE INDEX idx_notif_queue_hospital ON public.notification_queue(hospital_id);
CREATE INDEX idx_notif_queue_patient ON public.notification_queue(patient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO service_role;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view notif queue" ON public.notification_queue FOR SELECT TO authenticated
  USING (public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Members insert notif queue" ON public.notification_queue FOR INSERT TO authenticated
  WITH CHECK (public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Admins manage notif queue" ON public.notification_queue FOR UPDATE TO authenticated
  USING (public.is_hospital_admin(auth.uid(), hospital_id));

CREATE TRIGGER trg_notif_queue_updated BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- HOSPITAL MESSAGING CONFIG (per-hospital WhatsApp/SMS provider)
-- ============================================================
CREATE TABLE public.hospital_messaging_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL UNIQUE REFERENCES public.hospitals(id) ON DELETE CASCADE,
  sms_provider text DEFAULT 'africastalking' CHECK (sms_provider IN ('africastalking','twilio','none')),
  sms_sender_id text,
  whatsapp_provider text DEFAULT 'twilio' CHECK (whatsapp_provider IN ('twilio','meta','none')),
  whatsapp_from text,
  twilio_account_sid_secret_id text,
  twilio_auth_token_secret_id text,
  meta_phone_number_id text,
  meta_access_token_secret_id text,
  callback_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_messaging_config TO authenticated;
GRANT ALL ON public.hospital_messaging_config TO service_role;
ALTER TABLE public.hospital_messaging_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage messaging config" ON public.hospital_messaging_config FOR ALL TO authenticated
  USING (public.is_hospital_admin(auth.uid(), hospital_id))
  WITH CHECK (public.is_hospital_admin(auth.uid(), hospital_id));
CREATE TRIGGER trg_msg_cfg_updated BEFORE UPDATE ON public.hospital_messaging_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- USSD SESSIONS (Africa's Talking USSD state)
-- ============================================================
CREATE TABLE public.ussd_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  phone_number text NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  hospital_id uuid REFERENCES public.hospitals(id),
  current_step text,
  state jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ussd_sessions_phone ON public.ussd_sessions(phone_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ussd_sessions TO service_role;
ALTER TABLE public.ussd_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.ussd_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- CURRENCY RATES
-- ============================================================
CREATE TABLE public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date date NOT NULL,
  base_currency char(3) NOT NULL,
  quote_currency char(3) NOT NULL,
  rate numeric(18,8) NOT NULL,
  source text DEFAULT 'exchangerate.host',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rate_date, base_currency, quote_currency)
);
CREATE INDEX idx_currency_rates_lookup ON public.currency_rates(quote_currency, rate_date DESC);
GRANT SELECT ON public.currency_rates TO authenticated, anon;
GRANT ALL ON public.currency_rates TO service_role;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads FX" ON public.currency_rates FOR SELECT USING (true);

-- ============================================================
-- ADD CURRENCY COLUMNS TO FINANCIAL TABLES
-- ============================================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency char(3) DEFAULT 'KES';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency char(3) DEFAULT 'KES';
ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS currency char(3) DEFAULT 'KES';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee_currency char(3) DEFAULT 'KES';

-- ============================================================
-- HOSPITAL FACILITY METADATA (KMHFL/MFL)
-- ============================================================
ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS mfl_code text,
  ADD COLUMN IF NOT EXISTS facility_type text CHECK (facility_type IN ('dispensary','health_centre','sub_county_hospital','county_hospital','national_hospital','clinic','medical_centre','nursing_home','maternity','rehab','specialized')),
  ADD COLUMN IF NOT EXISTS keph_level int CHECK (keph_level BETWEEN 1 AND 6),
  ADD COLUMN IF NOT EXISTS ownership text CHECK (ownership IN ('moh','county_government','faith_based','private_for_profit','private_not_for_profit','ngo')),
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_authority text,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS accreditation_status text,
  ADD COLUMN IF NOT EXISTS accreditation_body text,
  ADD COLUMN IF NOT EXISTS default_currency char(3) DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS mfl_synced_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_hospitals_mfl ON public.hospitals(mfl_code);

-- ============================================================
-- PROFILE: preferred language
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS low_bandwidth_mode boolean DEFAULT false;

-- ============================================================
-- HELPER: render notification template
-- ============================================================
CREATE OR REPLACE FUNCTION public.render_notification(
  _hospital_id uuid, _template_key text, _channel text, _language text, _payload jsonb
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tpl record;
  v_body text;
  v_subject text;
  v_key text;
  v_val text;
BEGIN
  -- Prefer hospital-specific, then system, by language fallback to en
  SELECT * INTO v_tpl FROM public.notification_templates
    WHERE template_key = _template_key AND channel = _channel
      AND (hospital_id = _hospital_id OR hospital_id IS NULL)
      AND language IN (_language, 'en')
    ORDER BY (hospital_id = _hospital_id) DESC, (language = _language) DESC
    LIMIT 1;
  IF v_tpl IS NULL THEN RETURN NULL; END IF;

  v_body := v_tpl.body;
  v_subject := v_tpl.subject;
  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(COALESCE(_payload, '{}'::jsonb)) LOOP
    v_body := replace(v_body, '{{' || v_key || '}}', COALESCE(v_val, ''));
    IF v_subject IS NOT NULL THEN
      v_subject := replace(v_subject, '{{' || v_key || '}}', COALESCE(v_val, ''));
    END IF;
  END LOOP;

  RETURN jsonb_build_object('subject', v_subject, 'body', v_body, 'language', v_tpl.language);
END $$;

-- ============================================================
-- TRIGGER: schedule appointment reminder
-- ============================================================
CREATE OR REPLACE FUNCTION public.schedule_appointment_reminder()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_patient record;
  v_contact record;
  v_doctor_name text;
  v_lang text;
  v_payload jsonb;
BEGIN
  IF NEW.appointment_date < now() + interval '24 hours' THEN
    RETURN NEW;
  END IF;
  SELECT first_name, last_name, preferred_language INTO v_patient FROM public.patients WHERE id = NEW.patient_id;
  v_lang := COALESCE(v_patient.preferred_language, 'en');
  SELECT COALESCE(d.full_name, 'your doctor') INTO v_doctor_name FROM public.doctors d WHERE d.id = NEW.doctor_id;

  v_payload := jsonb_build_object(
    'patient_name', v_patient.first_name,
    'doctor_name', v_doctor_name,
    'date', to_char(NEW.appointment_date, 'Dy DD Mon YYYY HH24:MI'),
    'appointment_id', NEW.id
  );

  -- SMS reminder 24h before
  FOR v_contact IN
    SELECT value FROM public.patient_contacts
    WHERE patient_id = NEW.patient_id AND opt_in_sms = true
      AND contact_type LIKE 'phone%' AND is_primary = true
    LIMIT 1
  LOOP
    INSERT INTO public.notification_queue(hospital_id, patient_id, channel, template_key, language, recipient, payload, scheduled_for)
    VALUES (NEW.hospital_id, NEW.patient_id, 'sms', 'appointment_reminder_24h', v_lang, v_contact.value, v_payload, NEW.appointment_date - interval '24 hours');
  END LOOP;

  -- WhatsApp 2h before
  FOR v_contact IN
    SELECT value FROM public.patient_contacts
    WHERE patient_id = NEW.patient_id AND opt_in_whatsapp = true
      AND contact_type IN ('whatsapp','phone_personal','phone_alternate','phone_work')
    LIMIT 1
  LOOP
    INSERT INTO public.notification_queue(hospital_id, patient_id, channel, template_key, language, recipient, payload, scheduled_for)
    VALUES (NEW.hospital_id, NEW.patient_id, 'whatsapp', 'appointment_reminder_2h', v_lang, v_contact.value, v_payload, NEW.appointment_date - interval '2 hours');
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_schedule_appointment_reminder ON public.appointments;
CREATE TRIGGER trg_schedule_appointment_reminder AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.schedule_appointment_reminder();

-- ============================================================
-- TRIGGER: lab result ready
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_lab_result_ready()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_patient record;
  v_contact record;
  v_lang text;
  v_payload jsonb;
BEGIN
  IF NEW.result_status <> 'final' OR (TG_OP = 'UPDATE' AND OLD.result_status = 'final') THEN
    RETURN NEW;
  END IF;
  SELECT first_name, preferred_language INTO v_patient FROM public.patients WHERE id = NEW.patient_id;
  v_lang := COALESCE(v_patient.preferred_language, 'en');
  v_payload := jsonb_build_object('patient_name', v_patient.first_name);

  FOR v_contact IN
    SELECT value, contact_type, opt_in_sms, opt_in_whatsapp FROM public.patient_contacts
    WHERE patient_id = NEW.patient_id AND (opt_in_sms OR opt_in_whatsapp)
      AND contact_type LIKE 'phone%' AND is_primary = true
    LIMIT 1
  LOOP
    IF v_contact.opt_in_whatsapp THEN
      INSERT INTO public.notification_queue(hospital_id, patient_id, channel, template_key, language, recipient, payload)
      VALUES (NEW.hospital_id, NEW.patient_id, 'whatsapp', 'lab_result_ready', v_lang, v_contact.value, v_payload);
    ELSIF v_contact.opt_in_sms THEN
      INSERT INTO public.notification_queue(hospital_id, patient_id, channel, template_key, language, recipient, payload)
      VALUES (NEW.hospital_id, NEW.patient_id, 'sms', 'lab_result_ready', v_lang, v_contact.value, v_payload);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_lab_result_ready ON public.lab_results;
CREATE TRIGGER trg_notify_lab_result_ready AFTER INSERT OR UPDATE OF result_status ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.notify_lab_result_ready();

-- ============================================================
-- SEED SYSTEM NOTIFICATION TEMPLATES (hospital_id NULL = global)
-- ============================================================
INSERT INTO public.notification_templates(hospital_id, template_key, channel, language, subject, body, variables, is_system) VALUES
-- Appointment 24h
(NULL,'appointment_reminder_24h','sms','en',NULL,'Hello {{patient_name}}, reminder: appointment with {{doctor_name}} on {{date}}. Reply STOP to opt out.',ARRAY['patient_name','doctor_name','date'],true),
(NULL,'appointment_reminder_24h','sms','sw',NULL,'Habari {{patient_name}}, kumbusho: miadi na {{doctor_name}} tarehe {{date}}.',ARRAY['patient_name','doctor_name','date'],true),
(NULL,'appointment_reminder_24h','sms','fr',NULL,'Bonjour {{patient_name}}, rappel: rendez-vous avec {{doctor_name}} le {{date}}.',ARRAY['patient_name','doctor_name','date'],true),
(NULL,'appointment_reminder_24h','whatsapp','en',NULL,'Hello {{patient_name}}, reminder: appointment with {{doctor_name}} on {{date}}.',ARRAY['patient_name','doctor_name','date'],true),
-- Appointment 2h
(NULL,'appointment_reminder_2h','sms','en',NULL,'Reminder: your appointment with {{doctor_name}} is in 2 hours.',ARRAY['doctor_name'],true),
(NULL,'appointment_reminder_2h','whatsapp','en',NULL,'Hi {{patient_name}}, your appointment with {{doctor_name}} is in 2 hours.',ARRAY['patient_name','doctor_name'],true),
(NULL,'appointment_reminder_2h','whatsapp','sw',NULL,'Habari {{patient_name}}, miadi yako na {{doctor_name}} ni baada ya saa 2.',ARRAY['patient_name','doctor_name'],true),
-- Lab result ready
(NULL,'lab_result_ready','sms','en',NULL,'Hello {{patient_name}}, your lab results are ready. Please contact the clinic to discuss.',ARRAY['patient_name'],true),
(NULL,'lab_result_ready','sms','sw',NULL,'Habari {{patient_name}}, matokeo ya maabara yapo tayari. Tafadhali wasiliana na kliniki.',ARRAY['patient_name'],true),
(NULL,'lab_result_ready','sms','fr',NULL,'Bonjour {{patient_name}}, vos résultats sont prêts. Veuillez contacter la clinique.',ARRAY['patient_name'],true),
(NULL,'lab_result_ready','whatsapp','en',NULL,'Hi {{patient_name}}, your lab results are ready. Please contact the clinic to discuss.',ARRAY['patient_name'],true),
-- Prescription ready
(NULL,'prescription_ready','sms','en',NULL,'Hello {{patient_name}}, your prescription is ready for pickup at the pharmacy.',ARRAY['patient_name'],true),
(NULL,'prescription_ready','sms','sw',NULL,'Habari {{patient_name}}, dawa zako ziko tayari katika famasia.',ARRAY['patient_name'],true),
(NULL,'prescription_ready','whatsapp','en',NULL,'Hi {{patient_name}}, your prescription is ready for pickup.',ARRAY['patient_name'],true),
-- Claim status
(NULL,'claim_status_update','sms','en',NULL,'Insurance claim {{claim_number}} status: {{status}}. Amount: {{currency}} {{amount}}.',ARRAY['claim_number','status','currency','amount'],true),
(NULL,'claim_status_update','whatsapp','en',NULL,'Insurance claim {{claim_number}} status: {{status}}. Amount: {{currency}} {{amount}}.',ARRAY['claim_number','status','currency','amount'],true),
-- Payment received
(NULL,'payment_received','sms','en',NULL,'Payment of {{currency}} {{amount}} received. Receipt: {{receipt_number}}. Thank you.',ARRAY['currency','amount','receipt_number'],true),
(NULL,'payment_received','sms','sw',NULL,'Malipo ya {{currency}} {{amount}} yamepokelewa. Risiti: {{receipt_number}}. Asante.',ARRAY['currency','amount','receipt_number'],true),
(NULL,'payment_received','whatsapp','en',NULL,'Payment of {{currency}} {{amount}} received. Receipt: {{receipt_number}}.',ARRAY['currency','amount','receipt_number'],true),
-- Vaccination due
(NULL,'vaccination_due','sms','en',NULL,'Reminder: {{child_name}} is due for {{vaccine}} on {{due_date}}. Visit the clinic.',ARRAY['child_name','vaccine','due_date'],true),
(NULL,'vaccination_due','sms','sw',NULL,'Kumbusho: {{child_name}} anastahili chanjo ya {{vaccine}} tarehe {{due_date}}.',ARRAY['child_name','vaccine','due_date'],true),
-- ANC visit
(NULL,'anc_visit_due','sms','en',NULL,'Reminder: your ANC visit is due on {{due_date}}. Please visit the clinic.',ARRAY['due_date'],true),
(NULL,'anc_visit_due','sms','sw',NULL,'Kumbusho: ziara yako ya ANC inastahili tarehe {{due_date}}.',ARRAY['due_date'],true),
-- ART refill
(NULL,'art_refill_due','sms','en',NULL,'Reminder: your ART refill is due on {{due_date}}. Please collect your medication.',ARRAY['due_date'],true),
(NULL,'art_refill_due','sms','sw',NULL,'Kumbusho: dawa zako za ART zinastahili tarehe {{due_date}}. Tafadhali zipokee.',ARRAY['due_date'],true);

-- Enable realtime on notification_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;
