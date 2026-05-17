import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveCountry, type CountryConfig } from "@/lib/locale";

interface HospitalContextType {
  hospitalId: string | null;
  hospitalName: string | null;
  userRole: string | null;
  country: CountryConfig;
  currency: string;
  loading: boolean;
  needsOnboarding: boolean;
  refetch: () => void;
}

const HospitalContext = createContext<HospitalContextType>({
  hospitalId: null, hospitalName: null, userRole: null,
  country: resolveCountry("KE"), currency: "KES",
  loading: true, needsOnboarding: false, refetch: () => {},
});

export function HospitalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [countryStr, setCountryStr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchHospital = async () => {
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from("hospital_members")
      .select("hospital_id, role, hospitals(name, country)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (membership) {
      setHospitalId(membership.hospital_id);
      setUserRole(membership.role);
      setHospitalName((membership.hospitals as any)?.name || null);
      setCountryStr((membership.hospitals as any)?.country || null);
      setNeedsOnboarding(false);
    } else {
      setNeedsOnboarding(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHospital();
  }, [user]);

  const country = resolveCountry(countryStr);

  return (
    <HospitalContext.Provider value={{
      hospitalId, hospitalName, userRole,
      country, currency: country.currency,
      loading, needsOnboarding, refetch: fetchHospital,
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  return useContext(HospitalContext);
}
