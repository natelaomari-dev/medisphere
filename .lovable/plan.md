# Kenyan Public-Sector Clinical Modules

This is a large, multi-domain build. I'll deliver it in **5 sequential migrations + 5 pages**, each scoped to one clinical domain. All tables follow existing patterns: `hospital_id` scoped, `is_hospital_member` RLS, GRANTs to `authenticated` + `service_role`, `set_hospital_id_from_patient` triggers where relevant.

## Phase 1 — Maternal & Child Health (MCH)

**Migration 1a — MCH tables**
- `mch_anc_visits` — antenatal visit data (gestational age, BP, fundal height, FHR, urinalysis, Hb, HIV/syphilis/malaria status, TT dose, IFAS, mosquito net, complications, next visit)
- `mch_deliveries` — delivery record (mode, outcome, APGAR, birth weight, place) with CHECK constraints via triggers (not CHECK, since CHECK must be immutable — actually plain enum-style CHECKs are fine, they're immutable)
- `mch_postnatal_visits` — PNC schedule (6hr/6day/6wk visits, mother + baby exam, breastfeeding, family planning counseling)
- `child_immunizations` — child vaccine doses (links to patient as `child_patient_id`)
- `growth_monitoring` — anthropometry with `wfa_z`, `hfa_z`, `wfh_z` calculated by trigger using simplified WHO LMS (we'll implement a `calculate_who_zscore` function using a seeded `who_growth_standards` lookup table for boys/girls 0–60 months, or a simplified linear approximation noting this is a simplification)
- `kepi_schedule` (reference table) — seed BCG, OPV0/1/2/3, Penta1/2/3, PCV1/2/3, Rota1/2, IPV, Measles-Rubella 1/2, Yellow Fever, etc.

**Page** `src/pages/MCH.tsx` — three tabs: ANC visits, Deliveries, PNC visits. Each tab: list view + "Add visit" dialog. Patient selector at top.

**Page** `src/pages/Pediatrics.tsx` — child selector → two tabs: Immunization schedule (table of KEPI doses, scheduled vs given with date pickers) + Growth chart (Recharts line chart of weight-for-age, height-for-age, with WHO z-score reference bands).

**MOH 333 update**: Update `MOHReports.tsx` 333 generator to query `mch_deliveries`, `mch_anc_visits` for actual counts.

## Phase 2 — HIV Care

**Migration 2** — `hiv_enrollments`, `art_regimens`, `viral_load_results`, `art_dispenses`.

**Page** `src/pages/HIVCare.tsx` — patient selector → tabs: Enrollment summary (CCC#, WHO stage, baseline CD4/VL), Regimen history (timeline), VL trend (Recharts line), ART adherence dashboard (computed: pills dispensed vs expected based on days_supplied gaps).

**MOH 731 update**: query these tables for ART cohort, VL suppression %, retention.

## Phase 3 — TB Care

**Migration 3** — `tb_cases`, `tb_dot_visits`, `tb_contacts`.

**Page** `src/pages/TBCare.tsx` — registry list, case detail with DOT calendar + contact tracing tab.

**MOH 711 update**: integrate TB notification counts.

## Phase 4 — IDSR (Notifiable Disease Surveillance)

**Migration 4**
- `notifiable_conditions_registry` (text PK, condition_name, icd_codes text[], window hours, immediate bool) — seed 14 conditions with ICD-10 codes
- `idsr_notifications` (with status workflow)
- Trigger `idsr_check_diagnosis` on `diagnoses` INSERT: scans ICD code against registry; if match → INSERT `idsr_notifications` (status='pending') + INSERT `ai_alerts` (type='notifiable_disease', severity='critical' if immediate else 'high')

IDSR notifications appear in existing `AIInsights` alerts feed; no new page (small registry view added to MOHReports if time permits).

## Phase 5 — Clinical Decision Support (EWS) + Order Sets

**Migration 5a — EWS**
- Functions: `calculate_news2`, `calculate_qsofa`, `calculate_pews`, `calculate_mews`, `calculate_gcs` — pure SQL functions returning int + jsonb components
- Table `clinical_scores` (id, patient_id, encounter_id, score_type, score_value int, components jsonb, action_recommended text, calculated_at)
- Trigger on `vitals` INSERT: compute NEWS2 (always), and conditionally PEWS/MEWS based on patient age/pregnancy → insert into `clinical_scores`. If NEWS2 ≥ 7 → INSERT `ai_alerts` type='deterioration' severity='critical'.

**Migration 5b — Order Sets**
- `order_sets` (hospital_id scoped)
- `order_set_items` (item_type, item_data jsonb, sequence)
- Seed 10 order sets (sepsis bundle, DKA, severe malaria, normal labor, post-op cholecystectomy, acute MI, peds pneumonia, pre-eclampsia, snakebite, SAM)

**MedicalRecords.tsx update**: Add "Apply order set" button per record → dialog lists hospital's order sets → on apply, iterates items and INSERTs to `lab_orders`, `prescriptions` (if exists; else medication notes), `nurse_notes`.

## Sidebar/Routing

Add four new nav items in `AppSidebar.tsx`: MCH, Pediatrics, HIV Care, TB Care. Add routes in `App.tsx`.

## Technical notes

- **CHECK constraints**: Per project rules, time-based validations must use triggers. Static enum-style CHECKs (e.g. `mode in ('svd',...)`) are immutable and allowed.
- **WHO z-scores**: Full LMS tables are large. I'll seed a compact reference table for ages 0/3/6/12/24/36/48/60 months for both sexes (median + SD per age) and interpolate linearly. The trigger documents this as a clinical estimate; production deployment should swap in full WHO LMS data.
- **Realtime alerts**: IDSR + NEWS2 critical → `ai_alerts` row which existing alert subscriptions surface.
- **No edits** to `supabase/integrations/types.ts`, `client.ts`, `.env` (auto-generated).

## Files

**New migrations** (5 sequential):
- MCH tables + KEPI seed + WHO standards seed
- HIV care tables
- TB care tables
- IDSR registry + trigger
- EWS functions/trigger + Order Sets + seeds

**New pages**: `MCH.tsx`, `Pediatrics.tsx`, `HIVCare.tsx`, `TBCare.tsx`

**Edited**: `AppSidebar.tsx`, `App.tsx`, `MOHReports.tsx`, `MedicalRecords.tsx` (Apply order set)

## Scope confirmation

Given the size (~5 migrations, 4 new pages, ~2000 LOC), I'll proceed in order and deliver each phase as a coherent unit. If you'd rather stage delivery (e.g. ship MCH first, review, then continue), say so before approving — otherwise I'll execute all five phases sequentially in this loop.
