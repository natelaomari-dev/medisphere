// Kenya KMHFL Master Facility List lookup (public API)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(JSON.stringify({ error: "code parameter required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // KMHFL public read endpoint
    const apiUrl = `https://api.kmhfl.health.go.ke/api/facilities/facilities/?code=${encodeURIComponent(code)}&format=json`;
    const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: "KMHFL lookup failed", status: res.status,
        hint: "KMHFL API may require auth or be temporarily unavailable. You can still enter facility data manually."
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await res.json();
    const facility = json?.results?.[0];
    if (!facility) {
      return new Response(JSON.stringify({ found: false, message: "No facility with that code." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      found: true,
      facility: {
        name: facility.name || facility.official_name,
        mfl_code: facility.code,
        facility_type: facility.facility_type_name?.toLowerCase().replace(/\s+/g, "_"),
        keph_level: facility.keph_level_name ? parseInt(String(facility.keph_level_name).match(/\d/)?.[0] || "0") : null,
        ownership: facility.owner_type_name?.toLowerCase().replace(/[^a-z]+/g, "_"),
        county: facility.county_name,
        sub_county: facility.constituency_name,
        ward: facility.ward_name,
        address: facility.physical_address,
        phone: facility.officer_in_charge_contact || facility.facility_contact,
        license_authority: "Ministry of Health (Kenya)",
        raw: facility,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
