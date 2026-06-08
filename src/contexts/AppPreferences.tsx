import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AppPreferencesContextType {
  language: string;
  setLanguage: (lng: string) => Promise<void>;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean) => Promise<void>;
}

const Ctx = createContext<AppPreferencesContextType>({
  language: "en", setLanguage: async () => {},
  lowBandwidth: false, setLowBandwidth: async () => {},
});

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || "en");
  const [lowBandwidth, setLowBandwidthState] = useState(() => localStorage.getItem("low_bandwidth_mode") === "1");

  // Hydrate from profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferred_language, low_bandwidth_mode").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_language && data.preferred_language !== language) {
          i18n.changeLanguage(data.preferred_language);
          setLanguageState(data.preferred_language);
        }
        if (typeof data?.low_bandwidth_mode === "boolean") {
          setLowBandwidthState(data.low_bandwidth_mode);
          localStorage.setItem("low_bandwidth_mode", data.low_bandwidth_mode ? "1" : "0");
        }
      });
  }, [user]);

  const setLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    setLanguageState(lng);
    localStorage.setItem("preferred_language", lng);
    if (user) await supabase.from("profiles").update({ preferred_language: lng }).eq("user_id", user.id);
  };

  const setLowBandwidth = async (v: boolean) => {
    setLowBandwidthState(v);
    localStorage.setItem("low_bandwidth_mode", v ? "1" : "0");
    if (user) await supabase.from("profiles").update({ low_bandwidth_mode: v }).eq("user_id", user.id);
  };

  return <Ctx.Provider value={{ language, setLanguage, lowBandwidth, setLowBandwidth }}>{children}</Ctx.Provider>;
}

export const useAppPreferences = () => useContext(Ctx);
