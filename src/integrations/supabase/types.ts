export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          actual_discharge_date: string | null
          admission_date: string
          admission_reason: string
          admission_type: string
          admitting_doctor_id: string | null
          attending_doctor_id: string | null
          bed_id: string | null
          created_at: string
          discharge_diagnosis: string | null
          discharge_summary: string | null
          discharged_by: string | null
          expected_discharge_date: string | null
          hospital_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["admission_status"]
          updated_at: string
          ward_id: string
        }
        Insert: {
          actual_discharge_date?: string | null
          admission_date?: string
          admission_reason: string
          admission_type?: string
          admitting_doctor_id?: string | null
          attending_doctor_id?: string | null
          bed_id?: string | null
          created_at?: string
          discharge_diagnosis?: string | null
          discharge_summary?: string | null
          discharged_by?: string | null
          expected_discharge_date?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          ward_id: string
        }
        Update: {
          actual_discharge_date?: string | null
          admission_date?: string
          admission_reason?: string
          admission_type?: string
          admitting_doctor_id?: string | null
          attending_doctor_id?: string | null
          bed_id?: string | null
          created_at?: string
          discharge_diagnosis?: string | null
          discharge_summary?: string | null
          discharged_by?: string | null
          expected_discharge_date?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_admitting_doctor_id_fkey"
            columns: ["admitting_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          confidence: number | null
          created_at: string
          hospital_id: string | null
          id: string
          is_acknowledged: boolean | null
          message: string
          patient_id: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          confidence?: number | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_acknowledged?: boolean | null
          message: string
          patient_id?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          confidence?: number | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_acknowledged?: boolean | null
          message?: string
          patient_id?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_alerts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          created_by: string | null
          doctor_id: string
          duration_minutes: number | null
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          type: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          created_by?: string | null
          doctor_id: string
          duration_minutes?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          bed_type: string
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          is_available: boolean
          updated_at: string
          ward_id: string
        }
        Insert: {
          bed_number: string
          bed_type?: string
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          updated_at?: string
          ward_id: string
        }
        Update: {
          bed_number?: string
          bed_type?: string
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          updated_at?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          created_at: string
          diagnosis_type: string
          hospital_id: string | null
          icd_code: string
          icd_description: string
          id: string
          medical_record_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          diagnosis_type?: string
          hospital_id?: string | null
          icd_code: string
          icd_description: string
          id?: string
          medical_record_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          diagnosis_type?: string
          hospital_id?: string | null
          icd_code?: string
          icd_description?: string
          id?: string
          medical_record_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          consultation_fee: number | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          hospital_id: string | null
          id: string
          is_available: boolean | null
          license_number: string | null
          phone: string | null
          specialization: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          consultation_fee?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          hospital_id?: string | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone?: string | null
          specialization: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          consultation_fee?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          hospital_id?: string | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone?: string | null
          specialization?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_members: {
        Row: {
          hospital_id: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          hospital_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          hospital_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_members_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          bed_capacity: number | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bed_capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bed_capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      icu_beds: {
        Row: {
          admission_date: string | null
          attending_doctor_id: string | null
          bed_number: string
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          gcs_score: number | null
          heart_rate: number | null
          hospital_id: string | null
          id: string
          is_occupied: boolean
          isolation: boolean
          last_vitals_at: string | null
          notes: string | null
          patient_id: string | null
          respiratory_rate: number | null
          risk_score: number | null
          spo2: number | null
          temperature: number | null
          updated_at: string
          ventilator: boolean
        }
        Insert: {
          admission_date?: string | null
          attending_doctor_id?: string | null
          bed_number: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          gcs_score?: number | null
          heart_rate?: number | null
          hospital_id?: string | null
          id?: string
          is_occupied?: boolean
          isolation?: boolean
          last_vitals_at?: string | null
          notes?: string | null
          patient_id?: string | null
          respiratory_rate?: number | null
          risk_score?: number | null
          spo2?: number | null
          temperature?: number | null
          updated_at?: string
          ventilator?: boolean
        }
        Update: {
          admission_date?: string | null
          attending_doctor_id?: string | null
          bed_number?: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          gcs_score?: number | null
          heart_rate?: number | null
          hospital_id?: string | null
          id?: string
          is_occupied?: boolean
          isolation?: boolean
          last_vitals_at?: string | null
          notes?: string | null
          patient_id?: string | null
          respiratory_rate?: number | null
          risk_score?: number | null
          spo2?: number | null
          temperature?: number | null
          updated_at?: string
          ventilator?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "icu_beds_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icu_beds_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icu_beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_amount: number
          claim_number: string
          claim_status: Database["public"]["Enums"]["claim_status"]
          created_at: string
          diagnosis_codes: string[] | null
          hospital_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          patient_id: string
          rejection_reason: string | null
          response_date: string | null
          scheme_name: string | null
          sha_member_number: string | null
          submission_date: string | null
          submitted_by: string | null
          supporting_documents: string[] | null
          treatment_description: string | null
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          claim_amount: number
          claim_number?: string
          claim_status?: Database["public"]["Enums"]["claim_status"]
          created_at?: string
          diagnosis_codes?: string[] | null
          hospital_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id: string
          rejection_reason?: string | null
          response_date?: string | null
          scheme_name?: string | null
          sha_member_number?: string | null
          submission_date?: string | null
          submitted_by?: string | null
          supporting_documents?: string[] | null
          treatment_description?: string | null
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          claim_amount?: number
          claim_number?: string
          claim_status?: Database["public"]["Enums"]["claim_status"]
          created_at?: string
          diagnosis_codes?: string[] | null
          hospital_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string
          rejection_reason?: string | null
          response_date?: string | null
          scheme_name?: string | null
          sha_member_number?: string | null
          submission_date?: string | null
          submitted_by?: string | null
          supporting_documents?: string[] | null
          treatment_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          hospital_id: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          hospital_id?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          hospital_id?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          hospital_id: string | null
          id: string
          notes: string | null
          ordered_by: string
          patient_id: string
          priority: string
          reference_range: string | null
          result_notes: string | null
          result_unit: string | null
          result_value: string | null
          status: Database["public"]["Enums"]["lab_order_status"]
          test_category: string
          test_name: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          ordered_by: string
          patient_id: string
          priority?: string
          reference_range?: string | null
          result_notes?: string | null
          result_unit?: string | null
          result_value?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          test_category?: string
          test_name: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          ordered_by?: string
          patient_id?: string
          priority?: string
          reference_range?: string | null
          result_notes?: string | null
          result_unit?: string | null
          result_value?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          test_category?: string
          test_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          chief_complaint: string | null
          created_at: string
          doctor_id: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          history_of_present_illness: string | null
          hospital_id: string | null
          id: string
          past_medical_history: string | null
          patient_id: string
          physical_examination: string | null
          status: string
          treatment_plan: string | null
          updated_at: string
          visit_type: string
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          history_of_present_illness?: string | null
          hospital_id?: string | null
          id?: string
          past_medical_history?: string | null
          patient_id: string
          physical_examination?: string | null
          status?: string
          treatment_plan?: string | null
          updated_at?: string
          visit_type?: string
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          history_of_present_illness?: string | null
          hospital_id?: string | null
          id?: string
          past_medical_history?: string | null
          patient_id?: string
          physical_examination?: string | null
          status?: string
          treatment_plan?: string | null
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          category: string
          created_at: string
          dosage_form: string
          expiry_date: string | null
          generic_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          name: string
          reorder_level: number
          stock_quantity: number
          strength: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          dosage_form?: string
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dosage_form?: string
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name?: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      moh_reports: {
        Row: {
          approved_by: string | null
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          report_data: Json
          report_type: Database["public"]["Enums"]["moh_report_type"]
          reporting_period_end: string
          reporting_period_start: string
          submission_status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          report_data?: Json
          report_type: Database["public"]["Enums"]["moh_report_type"]
          reporting_period_end: string
          reporting_period_start: string
          submission_status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          report_data?: Json
          report_type?: Database["public"]["Enums"]["moh_report_type"]
          reporting_period_end?: string
          reporting_period_start?: string
          submission_status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nurse_notes: {
        Row: {
          admission_id: string
          content: string
          created_at: string
          hospital_id: string
          id: string
          note_type: string
          nurse_id: string | null
          patient_id: string
          shift: string | null
          vitals_snapshot: Json | null
        }
        Insert: {
          admission_id: string
          content: string
          created_at?: string
          hospital_id: string
          id?: string
          note_type?: string
          nurse_id?: string | null
          patient_id: string
          shift?: string | null
          vitals_snapshot?: Json | null
        }
        Update: {
          admission_id?: string
          content?: string
          created_at?: string
          hospital_id?: string
          id?: string
          note_type?: string
          nurse_id?: string | null
          patient_id?: string
          shift?: string | null
          vitals_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "nurse_notes_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_notes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          ai_risk_score: number | null
          allergies: string[] | null
          blood_type: string | null
          chronic_conditions: string[] | null
          created_at: string
          created_by: string | null
          current_medications: Json | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string
          hospital_id: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          last_name: string
          notes: string | null
          patient_id: string
          phone: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          address?: string | null
          ai_risk_score?: number | null
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          created_by?: string | null
          current_medications?: Json | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender: string
          hospital_id?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          last_name: string
          notes?: string | null
          patient_id?: string
          phone?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          address?: string | null
          ai_risk_score?: number | null
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          created_by?: string | null
          current_medications?: Json | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string
          hospital_id?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          last_name?: string
          notes?: string | null
          patient_id?: string
          phone?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          hospital_id: string
          id: string
          invoice_id: string | null
          mpesa_checkout_request_id: string | null
          mpesa_receipt_number: string | null
          notes: string | null
          paid_at: string | null
          patient_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone_number: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          hospital_id: string
          id?: string
          invoice_id?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_receipt_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone_number?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          hospital_id?: string
          id?: string
          invoice_id?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_receipt_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone_number?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dispensed_at: string | null
          dispensed_by: string | null
          doctor_id: string | null
          dosage: string
          duration: string | null
          frequency: string
          hospital_id: string | null
          id: string
          medication_id: string
          notes: string | null
          patient_id: string
          quantity: number
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_id?: string | null
          dosage: string
          duration?: string | null
          frequency: string
          hospital_id?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          patient_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_id?: string | null
          dosage?: string
          duration?: string | null
          frequency?: string
          hospital_id?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          patient_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          hospital_id: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          hospital_id?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          hospital_id?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          hospital_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          hospital_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          hospital_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultations: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          duration_minutes: number
          ended_at: string | null
          hospital_id: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["teleconsult_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          duration_minutes?: number
          ended_at?: string | null
          hospital_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["teleconsult_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          duration_minutes?: number
          ended_at?: string | null
          hospital_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["teleconsult_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_records: {
        Row: {
          ai_recommendation: string | null
          ai_risk_score: number | null
          assessed_by: string | null
          created_at: string
          hospital_id: string | null
          id: string
          patient_id: string | null
          priority: Database["public"]["Enums"]["triage_priority"] | null
          suggested_department: string | null
          suggested_doctor_id: string | null
          symptoms: string
          vitals: Json | null
        }
        Insert: {
          ai_recommendation?: string | null
          ai_risk_score?: number | null
          assessed_by?: string | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          priority?: Database["public"]["Enums"]["triage_priority"] | null
          suggested_department?: string | null
          suggested_doctor_id?: string | null
          symptoms: string
          vitals?: Json | null
        }
        Update: {
          ai_recommendation?: string | null
          ai_risk_score?: number | null
          assessed_by?: string | null
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          priority?: Database["public"]["Enums"]["triage_priority"] | null
          suggested_department?: string | null
          suggested_doctor_id?: string | null
          symptoms?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "triage_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_records_suggested_doctor_id_fkey"
            columns: ["suggested_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          bmi: number | null
          created_at: string
          heart_rate: number | null
          height: number | null
          hospital_id: string | null
          id: string
          medical_record_id: string | null
          notes: string | null
          pain_level: number | null
          patient_id: string
          recorded_by: string | null
          respiratory_rate: number | null
          spo2: number | null
          temperature: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          hospital_id?: string | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          pain_level?: number | null
          patient_id: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          hospital_id?: string | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          pain_level?: number | null
          patient_id?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          created_at: string
          floor: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          total_beds: number
          updated_at: string
          ward_type: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          total_beds?: number
          updated_at?: string
          ward_type?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          total_beds?: number
          updated_at?: string
          ward_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wards_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_hospital_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hospital_admin: {
        Args: { _hospital_id: string; _user_id: string }
        Returns: boolean
      }
      is_hospital_member: {
        Args: { _hospital_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admission_status: "admitted" | "discharged" | "transferred" | "deceased"
      app_role:
        | "admin"
        | "doctor"
        | "nurse"
        | "pharmacist"
        | "lab_tech"
        | "receptionist"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      claim_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "partially_approved"
        | "rejected"
        | "paid"
        | "appealed"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      lab_order_status:
        | "pending"
        | "sample_collected"
        | "processing"
        | "completed"
        | "cancelled"
      moh_report_type:
        | "moh_705a"
        | "moh_705b"
        | "moh_711"
        | "moh_333"
        | "moh_406"
      payment_method: "cash" | "mpesa" | "card" | "insurance" | "bank_transfer"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      prescription_status:
        | "pending"
        | "dispensed"
        | "partially_dispensed"
        | "cancelled"
      risk_level: "low" | "medium" | "high" | "critical"
      teleconsult_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      triage_priority:
        | "non_urgent"
        | "semi_urgent"
        | "urgent"
        | "emergency"
        | "resuscitation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_status: ["admitted", "discharged", "transferred", "deceased"],
      app_role: [
        "admin",
        "doctor",
        "nurse",
        "pharmacist",
        "lab_tech",
        "receptionist",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      claim_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "partially_approved",
        "rejected",
        "paid",
        "appealed",
      ],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      lab_order_status: [
        "pending",
        "sample_collected",
        "processing",
        "completed",
        "cancelled",
      ],
      moh_report_type: [
        "moh_705a",
        "moh_705b",
        "moh_711",
        "moh_333",
        "moh_406",
      ],
      payment_method: ["cash", "mpesa", "card", "insurance", "bank_transfer"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      prescription_status: [
        "pending",
        "dispensed",
        "partially_dispensed",
        "cancelled",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      teleconsult_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      triage_priority: [
        "non_urgent",
        "semi_urgent",
        "urgent",
        "emergency",
        "resuscitation",
      ],
    },
  },
} as const
