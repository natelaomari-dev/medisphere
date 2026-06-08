import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFxRate(quote: string, base: string = "USD") {
  return useQuery({
    queryKey: ["fx", base, quote],
    queryFn: async () => {
      if (quote === base) return 1;
      const { data } = await supabase
        .from("currency_rates")
        .select("rate")
        .eq("base_currency", base)
        .eq("quote_currency", quote)
        .order("rate_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return Number(data?.rate || 0);
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function convertToUSD(amount: number, fromCurrency: string, rate: number) {
  if (fromCurrency === "USD" || !rate) return amount;
  return amount / rate;
}
