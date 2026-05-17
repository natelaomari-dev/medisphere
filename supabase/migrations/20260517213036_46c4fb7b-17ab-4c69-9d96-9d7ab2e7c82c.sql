
TRUNCATE TABLE
  public.vitals,
  public.diagnoses,
  public.nurse_notes,
  public.prescriptions,
  public.lab_orders,
  public.medical_records,
  public.triage_records,
  public.teleconsultations,
  public.ai_alerts,
  public.insurance_claims,
  public.payments,
  public.invoices,
  public.admissions,
  public.icu_beds,
  public.beds,
  public.wards,
  public.moh_reports,
  public.medications,
  public.appointments,
  public.doctors,
  public.patients
RESTART IDENTITY CASCADE;
