// Daily FX rate refresh from exchangerate.host
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const QUOTES = ["KES", "UGX", "TZS", "RWF", "BIF", "SSP", "ETB", "SOS", "EUR", "GBP", "ZAR", "NGN"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Free public endpoint, USD-base latest
    const res = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${QUOTES.join(",")}`);
    const json = await res.json();
    const rates: Record<string, number> = json?.rates || {};
    const rows = Object.entries(rates).map(([quote, rate]) => ({
      rate_date: today, base_currency: "USD", quote_currency: quote, rate, source: "exchangerate.host",
    }));
    if (rows.length === 0) throw new Error("No rates returned");
    const { error } = await admin.from("currency_rates").upsert(rows, { onConflict: "rate_date,base_currency,quote_currency" });
    if (error) throw error;
    return new Response(JSON.stringify({ inserted: rows.length, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
