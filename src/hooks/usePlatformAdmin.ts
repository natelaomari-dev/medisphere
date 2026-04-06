import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformAdmin() {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        setIsPlatformAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  return { isPlatformAdmin, loading };
}
