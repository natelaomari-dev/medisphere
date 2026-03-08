
-- Hospitals table (tenants)
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Nigeria',
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  bed_capacity INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hospital members (links users to hospitals with roles)
CREATE TABLE public.hospital_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'doctor',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, user_id)
);
ALTER TABLE public.hospital_members ENABLE ROW LEVEL SECURITY;

-- Staff invitations
CREATE TABLE public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'doctor',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, email)
);
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function: check if user belongs to hospital
CREATE OR REPLACE FUNCTION public.is_hospital_member(_user_id UUID, _hospital_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.hospital_members WHERE user_id = _user_id AND hospital_id = _hospital_id AND is_active = true) $$;

-- Security definer: check if user is hospital admin
CREATE OR REPLACE FUNCTION public.is_hospital_admin(_user_id UUID, _hospital_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.hospital_members WHERE user_id = _user_id AND hospital_id = _hospital_id AND role = 'admin' AND is_active = true) $$;

-- Security definer: get user's hospital id
CREATE OR REPLACE FUNCTION public.get_user_hospital_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT hospital_id FROM public.hospital_members WHERE user_id = _user_id AND is_active = true LIMIT 1 $$;

-- Hospitals: members can view their hospital, creator can insert
CREATE POLICY "Members can view their hospital" ON public.hospitals FOR SELECT TO authenticated
  USING (public.is_hospital_member(auth.uid(), id));
CREATE POLICY "Authenticated can create hospitals" ON public.hospitals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update their hospital" ON public.hospitals FOR UPDATE TO authenticated
  USING (public.is_hospital_admin(auth.uid(), id));

-- Hospital members: members can view their colleagues, admins can manage
CREATE POLICY "Members can view colleagues" ON public.hospital_members FOR SELECT TO authenticated
  USING (public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY "Admins can add members" ON public.hospital_members FOR INSERT TO authenticated
  WITH CHECK (public.is_hospital_admin(auth.uid(), hospital_id) OR auth.uid() = user_id);
CREATE POLICY "Admins can update members" ON public.hospital_members FOR UPDATE TO authenticated
  USING (public.is_hospital_admin(auth.uid(), hospital_id));

-- Staff invitations: admins can manage, invited user can view
CREATE POLICY "Admins can manage invitations" ON public.staff_invitations FOR ALL TO authenticated
  USING (public.is_hospital_admin(auth.uid(), hospital_id));
CREATE POLICY "Invited user can view invitation" ON public.staff_invitations FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add hospital_id to existing tables
ALTER TABLE public.patients ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
ALTER TABLE public.doctors ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
ALTER TABLE public.appointments ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
ALTER TABLE public.ai_alerts ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
ALTER TABLE public.triage_records ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id column to profiles for quick lookup
ALTER TABLE public.profiles ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
