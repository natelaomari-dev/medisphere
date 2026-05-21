# FHIR R4 Patient Model Refactor

A significant refactor adding FHIR R4-aligned demographics, child tables, and a 9-tab registration wizard. Existing `patients` table is preserved — new columns added, legacy data migrated into child tables.

## Phase 1 — Database migration (single migration file)

### 1a. Extend `patients` table
Add columns (existing `last_name`, `gender`, `allergies`, `chronic_conditions`, `emergency_contact_*` remain for backward compatibility during transition):
- Names: `given_names text[]`, `family_name text`, `other_names text[]`, `preferred_name`, `name_script` (default `'Latn'`)
- Identity: `sex_at_birth` (check), `gender_identity`, `pronouns`, `marital_status` (check), `occupation`, `occupation_code`, `education_level` (check)
- Locale: `preferred_language` (default `'en'`), `country_of_origin`, `refugee_status` (check)
- Other: `photo_url`
- Mortality: `is_deceased` (default false), `date_of_death`, `time_of_death`, `place_of_death`, three `cause_of_death_*`, `manner_of_death` (check), `certifying_doctor_id` → doctors

Backfill: split existing `first_name` → `given_names[]`; copy `last_name` → `family_name`; map `gender` ('M'/'F'/'Other') → `sex_at_birth`. After backfill, set `family_name NOT NULL`, `given_names NOT NULL DEFAULT '{}'`, `sex_at_birth NOT NULL DEFAULT 'unknown'`.

Note: "rename last_name to family_name with generated column for backcompat" — Postgres can't make `last_name` a generated column without dropping it first, and code still writes to it. Approach: keep both columns, add a trigger that syncs `family_name` ↔ `last_name` on insert/update so legacy code keeps working.

### 1b. Child tables (all with RLS via `is_hospital_member(auth.uid(), hospital_id)`)
- `patient_identifiers` + unique partial index `(patient_id) WHERE is_primary`
- `patient_contacts`
- `patient_addresses`
- `patient_relationships` — migrate existing `emergency_contact_name/phone` rows
- `patient_allergies` — migrate `patients.allergies[]`
- `patient_conditions` — migrate `patients.chronic_conditions[]`
- `patient_social_history`
- `patient_women_health` — UNIQUE on `patient_id`

Each child table gets a `hospital_id` (denormalized for RLS) populated by trigger from the parent patient row; `set_hospital_id_default` reused or a child-specific trigger that copies from `patients`.

RLS pattern on every table:
- SELECT/INSERT/UPDATE: `is_hospital_member(auth.uid(), hospital_id)`
- DELETE: admins only or omit

### 1c. `geographic_areas` table
Hierarchical: `id, parent_id, level (country|region|county|sub_county|ward), code, name, country_code`. Seed Kenya: 47 counties + sub-counties (top-level only initially; full ward seed deferred). Public-read RLS (no hospital scoping — reference data).

## Phase 2 — Frontend wizard

Replace the current "Add Patient" modal in `src/pages/Patients.tsx` with a 9-tab wizard component (`PatientRegistrationWizard.tsx`) using:
- `react-hook-form` + `zod` resolver
- `@/components/ui/tabs` for navigation, with Prev/Next + final Save
- Single submit handler runs a transactional sequence: insert `patients` row → use returned id to insert all child rows in parallel; on any failure, delete the patient row to roll back (Supabase JS has no client-side tx, so this compensation pattern is standard).

Tabs:
1. **Identity** — names array, sex at birth, DOB, gender identity, marital status, language, country (ISO list), refugee status, photo upload to existing storage
2. **Identifiers** — dynamic field array, "mark primary" radio
3. **Contacts** — dynamic field array, per-channel opt-ins
4. **Addresses** — country/region/county/sub-county cascading selects fed from `geographic_areas`
5. **Relationships** — dynamic field array
6. **Clinical baseline** — allergies, conditions, current meds, blood type, social history
7. **Women's health** — conditionally rendered when `sex_at_birth==='female'` AND age > 10
8. **Insurance** — multiple schemes (writes to `patient_identifiers` with type `sha_number`/`nhif_number`/`private_insurance`)
9. **Consents** — uses existing `patient_consents` table; insert one row per consent type granted

Existing modal/list/detail UI in `Patients.tsx` stays functional; only the add-patient flow is replaced.

## Phase 3 — Out of scope (callouts, not implemented)
- Full sub-county/ward seed for Kenya (only counties seeded; structure ready for later expansion)
- Edit flow for existing patients via the wizard (registration only this pass)
- Other pages (`Billing.tsx`, `Appointments.tsx`, etc.) continue to read legacy `first_name`/`last_name` via the sync trigger — no changes needed there

## Files changed
- New migration: `supabase/migrations/<ts>_fhir_patient_model.sql`
- New: `src/components/PatientRegistrationWizard.tsx` (+ small sub-components per tab if file grows)
- New: `src/lib/fhirPatientSchema.ts` (zod schemas + types)
- Edited: `src/pages/Patients.tsx` (swap add-patient modal for wizard)
- Edited: `src/hooks/useHospitalData.ts` (new `useRegisterPatient` mutation that does the multi-table insert)

## Approval needed
This will require approving one large database migration before frontend code lands.