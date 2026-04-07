
-- =====================================================
-- PHASE 4.1: SECURITY HARDENING - TENANT ISOLATION
-- Replace all permissive (true) policies with hospital-scoped access
-- =====================================================

-- Helper: records are accessible if user is a member of the record's hospital,
-- OR if hospital_id is NULL (backward compat with seed data)

-- ==================== PATIENTS ====================
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;

CREATE POLICY "Members can view patients" ON public.patients FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update patients" ON public.patients FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== APPOINTMENTS ====================
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;

CREATE POLICY "Members can view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== DOCTORS ====================
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;

CREATE POLICY "Members can view doctors" ON public.doctors FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL TO authenticated
  USING (hospital_id IS NULL OR is_hospital_admin(auth.uid(), hospital_id));

-- ==================== MEDICAL RECORDS ====================
DROP POLICY IF EXISTS "Authenticated can view medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated can update medical records" ON public.medical_records;

CREATE POLICY "Members can view medical records" ON public.medical_records FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create medical records" ON public.medical_records FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update medical records" ON public.medical_records FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== VITALS ====================
DROP POLICY IF EXISTS "Authenticated can view vitals" ON public.vitals;
DROP POLICY IF EXISTS "Authenticated can create vitals" ON public.vitals;
DROP POLICY IF EXISTS "Authenticated can update vitals" ON public.vitals;

CREATE POLICY "Members can view vitals" ON public.vitals FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create vitals" ON public.vitals FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update vitals" ON public.vitals FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== DIAGNOSES ====================
DROP POLICY IF EXISTS "Authenticated can view diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Authenticated can create diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Authenticated can update diagnoses" ON public.diagnoses;

CREATE POLICY "Members can view diagnoses" ON public.diagnoses FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create diagnoses" ON public.diagnoses FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update diagnoses" ON public.diagnoses FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== LAB ORDERS ====================
DROP POLICY IF EXISTS "Authenticated users can view lab orders" ON public.lab_orders;
DROP POLICY IF EXISTS "Authenticated users can create lab orders" ON public.lab_orders;
DROP POLICY IF EXISTS "Authenticated users can update lab orders" ON public.lab_orders;

CREATE POLICY "Members can view lab orders" ON public.lab_orders FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create lab orders" ON public.lab_orders FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update lab orders" ON public.lab_orders FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== MEDICATIONS ====================
DROP POLICY IF EXISTS "Authenticated can view medications" ON public.medications;
DROP POLICY IF EXISTS "Authenticated can manage medications" ON public.medications;
DROP POLICY IF EXISTS "Authenticated can update medications" ON public.medications;

CREATE POLICY "Members can view medications" ON public.medications FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create medications" ON public.medications FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update medications" ON public.medications FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== PRESCRIPTIONS ====================
DROP POLICY IF EXISTS "Authenticated can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated can update prescriptions" ON public.prescriptions;

CREATE POLICY "Members can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create prescriptions" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== ADMISSIONS ====================
DROP POLICY IF EXISTS "Authenticated can view admissions" ON public.admissions;
DROP POLICY IF EXISTS "Authenticated can create admissions" ON public.admissions;
DROP POLICY IF EXISTS "Authenticated can update admissions" ON public.admissions;

CREATE POLICY "Members can view admissions" ON public.admissions FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create admissions" ON public.admissions FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update admissions" ON public.admissions FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== BEDS ====================
DROP POLICY IF EXISTS "Authenticated can view beds" ON public.beds;
DROP POLICY IF EXISTS "Authenticated can create beds" ON public.beds;
DROP POLICY IF EXISTS "Authenticated can update beds" ON public.beds;

CREATE POLICY "Members can view beds" ON public.beds FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create beds" ON public.beds FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update beds" ON public.beds FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== WARDS ====================
DROP POLICY IF EXISTS "Authenticated can view wards" ON public.wards;
DROP POLICY IF EXISTS "Authenticated can create wards" ON public.wards;
DROP POLICY IF EXISTS "Authenticated can update wards" ON public.wards;

CREATE POLICY "Members can view wards" ON public.wards FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create wards" ON public.wards FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update wards" ON public.wards FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== NURSE NOTES ====================
DROP POLICY IF EXISTS "Authenticated can view nurse notes" ON public.nurse_notes;
DROP POLICY IF EXISTS "Authenticated can create nurse notes" ON public.nurse_notes;
DROP POLICY IF EXISTS "Authenticated can update nurse notes" ON public.nurse_notes;

CREATE POLICY "Members can view nurse notes" ON public.nurse_notes FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create nurse notes" ON public.nurse_notes FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update nurse notes" ON public.nurse_notes FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== ICU BEDS ====================
DROP POLICY IF EXISTS "Authenticated users can view ICU beds" ON public.icu_beds;
DROP POLICY IF EXISTS "Authenticated users can manage ICU beds" ON public.icu_beds;
DROP POLICY IF EXISTS "Authenticated users can update ICU beds" ON public.icu_beds;

CREATE POLICY "Members can view ICU beds" ON public.icu_beds FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create ICU beds" ON public.icu_beds FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update ICU beds" ON public.icu_beds FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== TELECONSULTATIONS ====================
DROP POLICY IF EXISTS "Authenticated can view teleconsultations" ON public.teleconsultations;
DROP POLICY IF EXISTS "Authenticated can create teleconsultations" ON public.teleconsultations;
DROP POLICY IF EXISTS "Authenticated can update teleconsultations" ON public.teleconsultations;

CREATE POLICY "Members can view teleconsultations" ON public.teleconsultations FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create teleconsultations" ON public.teleconsultations FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update teleconsultations" ON public.teleconsultations FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== TRIAGE RECORDS ====================
DROP POLICY IF EXISTS "Authenticated users can view triage" ON public.triage_records;
DROP POLICY IF EXISTS "Authenticated users can create triage" ON public.triage_records;

CREATE POLICY "Members can view triage" ON public.triage_records FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create triage" ON public.triage_records FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== AI ALERTS ====================
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.ai_alerts;
DROP POLICY IF EXISTS "System can create alerts" ON public.ai_alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.ai_alerts;

CREATE POLICY "Members can view alerts" ON public.ai_alerts FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create alerts" ON public.ai_alerts FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update alerts" ON public.ai_alerts FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== MOH REPORTS ====================
DROP POLICY IF EXISTS "Authenticated can view reports" ON public.moh_reports;
DROP POLICY IF EXISTS "Authenticated can create reports" ON public.moh_reports;
DROP POLICY IF EXISTS "Authenticated can update reports" ON public.moh_reports;

CREATE POLICY "Members can view reports" ON public.moh_reports FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create reports" ON public.moh_reports FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update reports" ON public.moh_reports FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== INSURANCE CLAIMS ====================
DROP POLICY IF EXISTS "Authenticated can view claims" ON public.insurance_claims;
DROP POLICY IF EXISTS "Authenticated can create claims" ON public.insurance_claims;
DROP POLICY IF EXISTS "Authenticated can update claims" ON public.insurance_claims;

CREATE POLICY "Members can view claims" ON public.insurance_claims FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create claims" ON public.insurance_claims FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update claims" ON public.insurance_claims FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== PAYMENTS ====================
DROP POLICY IF EXISTS "Authenticated can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated can create payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated can update payments" ON public.payments;

CREATE POLICY "Members can view payments" ON public.payments FOR SELECT TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update payments" ON public.payments FOR UPDATE TO authenticated
  USING (is_hospital_member(auth.uid(), hospital_id));

-- ==================== INVOICES ====================
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;

CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can create invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (hospital_id IS NULL OR is_hospital_member(auth.uid(), hospital_id));

-- ==================== PLATFORM ADMIN VISIBILITY ====================
-- Platform admins should also be able to view all hospitals for the super admin dashboard
CREATE POLICY "Platform admins can view all hospitals" ON public.hospitals FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));
