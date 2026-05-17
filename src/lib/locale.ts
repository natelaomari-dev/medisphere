// East Africa locale & currency helpers
export type CountryCode =
  | "KE" | "UG" | "TZ" | "RW" | "BI" | "SS" | "ET" | "SO";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string; // ISO 4217
  currencySymbol: string;
  dialCode: string;
  mobileMoney: string[]; // primary mobile money providers
  healthAuthority: string; // e.g. "MOH"
  healthInsurance: string; // e.g. "SHA" (KE), "NHIF" (TZ/UG)
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  KE: { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", dialCode: "+254",
        mobileMoney: ["M-Pesa", "Airtel Money"], healthAuthority: "Ministry of Health (KE)", healthInsurance: "SHA" },
  UG: { code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh", dialCode: "+256",
        mobileMoney: ["MTN MoMo", "Airtel Money"], healthAuthority: "Ministry of Health (UG)", healthInsurance: "NHIS" },
  TZ: { code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh", dialCode: "+255",
        mobileMoney: ["M-Pesa", "Tigo Pesa", "Airtel Money"], healthAuthority: "Ministry of Health (TZ)", healthInsurance: "NHIF" },
  RW: { code: "RW", name: "Rwanda", currency: "RWF", currencySymbol: "FRw", dialCode: "+250",
        mobileMoney: ["MTN MoMo", "Airtel Money"], healthAuthority: "Ministry of Health (RW)", healthInsurance: "RSSB / Mutuelle" },
  BI: { code: "BI", name: "Burundi", currency: "BIF", currencySymbol: "FBu", dialCode: "+257",
        mobileMoney: ["EcoCash", "Lumicash"], healthAuthority: "Ministry of Public Health (BI)", healthInsurance: "MFP" },
  SS: { code: "SS", name: "South Sudan", currency: "SSP", currencySymbol: "SSP", dialCode: "+211",
        mobileMoney: ["m-Gurush"], healthAuthority: "Ministry of Health (SS)", healthInsurance: "—" },
  ET: { code: "ET", name: "Ethiopia", currency: "ETB", currencySymbol: "Br", dialCode: "+251",
        mobileMoney: ["Telebirr", "M-Pesa"], healthAuthority: "Ministry of Health (ET)", healthInsurance: "CBHI / SHI" },
  SO: { code: "SO", name: "Somalia", currency: "SOS", currencySymbol: "Sh.So.", dialCode: "+252",
        mobileMoney: ["EVC Plus", "Zaad", "Sahal"], healthAuthority: "Ministry of Health (SO)", healthInsurance: "—" },
};

export const COUNTRY_LIST = Object.values(COUNTRIES);

export function resolveCountry(input?: string | null): CountryConfig {
  if (!input) return COUNTRIES.KE;
  const upper = input.toUpperCase();
  if (upper in COUNTRIES) return COUNTRIES[upper as CountryCode];
  const byName = COUNTRY_LIST.find(c => c.name.toLowerCase() === input.toLowerCase());
  return byName || COUNTRIES.KE;
}

export function formatMoney(amount: number | string | null | undefined, country?: string | null): string {
  const c = resolveCountry(country);
  const n = Number(amount || 0);
  return `${c.currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
