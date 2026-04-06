
-- Platform admins table (Infera Tech super admins)
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  )
$$;

CREATE POLICY "Platform admins can view" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage" ON public.platform_admins
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trial', 'suspended', 'cancelled', 'past_due');

-- Hospital subscriptions
CREATE TABLE public.hospital_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL UNIQUE REFERENCES public.hospitals(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'trial',
  monthly_fee numeric NOT NULL DEFAULT 0,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '30 days'),
  max_users integer DEFAULT 5,
  max_patients integer DEFAULT 100,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospital_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage subscriptions" ON public.hospital_subscriptions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Hospital admins can view own subscription" ON public.hospital_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_hospital_admin(auth.uid(), hospital_id));

CREATE TRIGGER update_hospital_subscriptions_updated_at
  BEFORE UPDATE ON public.hospital_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Platform audit logs
CREATE TABLE public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view audit logs" ON public.platform_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can create audit logs" ON public.platform_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_hospital_subscriptions_hospital ON public.hospital_subscriptions(hospital_id);
CREATE INDEX idx_hospital_subscriptions_status ON public.hospital_subscriptions(status);
CREATE INDEX idx_platform_audit_logs_actor ON public.platform_audit_logs(actor_id);
CREATE INDEX idx_platform_audit_logs_created ON public.platform_audit_logs(created_at DESC);
