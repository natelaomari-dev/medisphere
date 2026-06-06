// Claim adapter registry. Each adapter produces a CSV/XLSX-ready row payload.
// Adapter outputs CSV for now; live API integration can be added later.

export type ClaimAdapterType = "sha" | "nhif_legacy" | "aar" | "jubilee" | "britam" | "cic" | "madison" | "generic";

export interface ClaimRow {
  claim_number: string;
  patient_sha_number?: string | null;
  patient_member_number?: string | null;
  patient_name: string;
  dob?: string | null;
  sex?: string | null;
  admission_date?: string | null;
  discharge_date?: string | null;
  diagnosis_codes: string[];
  procedure_codes?: string[];
  total_charged: number;
  rebate?: number;
  balance_billed?: number;
  approved_amount?: number | null;
  notes?: string | null;
}

export interface ClaimAdapter {
  type: ClaimAdapterType;
  label: string;
  columns: string[];
  toCSV: (rows: ClaimRow[]) => string;
}

function csvEscape(v: any): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(headers: string[], rows: any[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
}

const shaColumns = [
  "claim_number", "patient_sha_number", "patient_name", "dob", "sex",
  "admission_date", "discharge_date", "diagnosis_codes", "procedure_codes",
  "total_charged", "nhif_rebate", "balance_billed",
];

export const claimAdapters: Record<ClaimAdapterType, ClaimAdapter> = {
  sha: {
    type: "sha", label: "SHA (Social Health Authority)",
    columns: shaColumns,
    toCSV: (rows) => toCSV(shaColumns, rows.map((r) => [
      r.claim_number, r.patient_sha_number || "", r.patient_name, r.dob || "", r.sex || "",
      r.admission_date || "", r.discharge_date || "",
      r.diagnosis_codes.join(";"), (r.procedure_codes || []).join(";"),
      r.total_charged.toFixed(2), (r.rebate || 0).toFixed(2), (r.balance_billed || 0).toFixed(2),
    ])),
  },
  nhif_legacy: {
    type: "nhif_legacy", label: "NHIF Legacy",
    columns: ["claim_no", "member_no", "name", "dob", "sex", "admit", "discharge", "icd_codes", "amount"],
    toCSV: (rows) => toCSV(
      ["claim_no", "member_no", "name", "dob", "sex", "admit", "discharge", "icd_codes", "amount"],
      rows.map((r) => [r.claim_number, r.patient_sha_number || "", r.patient_name, r.dob || "", r.sex || "",
        r.admission_date || "", r.discharge_date || "", r.diagnosis_codes.join("|"), r.total_charged.toFixed(2)]),
    ),
  },
  aar: { type: "aar", label: "AAR Insurance", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
  jubilee: { type: "jubilee", label: "Jubilee Insurance", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
  britam: { type: "britam", label: "Britam", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
  cic: { type: "cic", label: "CIC Insurance", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
  madison: { type: "madison", label: "Madison Insurance", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
  generic: { type: "generic", label: "Generic CSV", columns: shaColumns, toCSV: (rows) => claimAdapters.sha.toCSV(rows) },
};

export function parseShaResponseCSV(csv: string): Array<{ claim_number: string; status: string; approved_amount: number; rejection_reason?: string }> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => headers.indexOf(k);
  const ci = idx("claim_number"), si = idx("status"), ai = idx("approved_amount"), ri = idx("rejection_reason");
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    return {
      claim_number: cells[ci]?.trim() || "",
      status: (cells[si]?.trim() || "").toLowerCase(),
      approved_amount: parseFloat(cells[ai] || "0") || 0,
      rejection_reason: ri >= 0 ? cells[ri]?.trim() : undefined,
    };
  }).filter((r) => r.claim_number);
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
