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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      ai_processing_log: {
        Row: {
          created_at: string
          hospital_id: string | null
          id: string
          patient_id: string | null
          prompt_type: string
          redacted_payload: Json | null
          response_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          prompt_type: string
          redacted_payload?: Json | null
          response_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          prompt_type?: string
          redacted_payload?: Json | null
          response_summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          created_by: string | null
          doctor_id: string
          duration_minutes: number | null
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      art_dispenses: {
        Row: {
          created_at: string
          days_supplied: number | null
          dispense_date: string
          dispensed_by: string | null
          hospital_id: string
          id: string
          next_appointment: string | null
          notes: string | null
          patient_id: string
          pills_dispensed: number | null
          regimen_code: string | null
        }
        Insert: {
          created_at?: string
          days_supplied?: number | null
          dispense_date?: string
          dispensed_by?: string | null
          hospital_id: string
          id?: string
          next_appointment?: string | null
          notes?: string | null
          patient_id: string
          pills_dispensed?: number | null
          regimen_code?: string | null
        }
        Update: {
          created_at?: string
          days_supplied?: number | null
          dispense_date?: string
          dispensed_by?: string | null
          hospital_id?: string
          id?: string
          next_appointment?: string | null
          notes?: string | null
          patient_id?: string
          pills_dispensed?: number | null
          regimen_code?: string | null
        }
        Relationships: []
      }
      art_regimens: {
        Row: {
          created_at: string
          end_date: string | null
          hospital_id: string
          id: string
          patient_id: string
          prescribed_by: string | null
          reason_for_change: string | null
          regimen_code: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          prescribed_by?: string | null
          reason_for_change?: string | null
          regimen_code: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          prescribed_by?: string | null
          reason_for_change?: string | null
          regimen_code?: string
          start_date?: string
        }
        Relationships: []
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
      blood_crossmatches: {
        Row: {
          blood_unit_id: string
          created_at: string
          crossmatch_date: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          performed_by: string | null
          result: string | null
        }
        Insert: {
          blood_unit_id: string
          created_at?: string
          crossmatch_date?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          performed_by?: string | null
          result?: string | null
        }
        Update: {
          blood_unit_id?: string
          created_at?: string
          crossmatch_date?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_crossmatches_blood_unit_id_fkey"
            columns: ["blood_unit_id"]
            isOneToOne: false
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_crossmatches_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donors: {
        Row: {
          blood_group: string | null
          created_at: string
          deferral_reason: string | null
          dob: string | null
          donor_number: string
          hepatitis_b: string | null
          hepatitis_c: string | null
          hiv_status: string | null
          hospital_id: string
          id: string
          last_donation_date: string | null
          name: string
          phone: string | null
          rh_factor: string | null
          sex: string | null
          syphilis: string | null
          updated_at: string
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          deferral_reason?: string | null
          dob?: string | null
          donor_number: string
          hepatitis_b?: string | null
          hepatitis_c?: string | null
          hiv_status?: string | null
          hospital_id: string
          id?: string
          last_donation_date?: string | null
          name: string
          phone?: string | null
          rh_factor?: string | null
          sex?: string | null
          syphilis?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          deferral_reason?: string | null
          dob?: string | null
          donor_number?: string
          hepatitis_b?: string | null
          hepatitis_c?: string | null
          hiv_status?: string | null
          hospital_id?: string
          id?: string
          last_donation_date?: string | null
          name?: string
          phone?: string | null
          rh_factor?: string | null
          sex?: string | null
          syphilis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_donors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_transfusions: {
        Row: {
          blood_unit_id: string
          created_at: string
          ended_at: string | null
          hospital_id: string
          id: string
          indication: string | null
          patient_id: string
          performed_by: string | null
          post_transfusion_vitals: Json | null
          pre_transfusion_vitals: Json | null
          reactions: string | null
          started_at: string | null
          updated_at: string
          witnessed_by: string | null
        }
        Insert: {
          blood_unit_id: string
          created_at?: string
          ended_at?: string | null
          hospital_id: string
          id?: string
          indication?: string | null
          patient_id: string
          performed_by?: string | null
          post_transfusion_vitals?: Json | null
          pre_transfusion_vitals?: Json | null
          reactions?: string | null
          started_at?: string | null
          updated_at?: string
          witnessed_by?: string | null
        }
        Update: {
          blood_unit_id?: string
          created_at?: string
          ended_at?: string | null
          hospital_id?: string
          id?: string
          indication?: string | null
          patient_id?: string
          performed_by?: string | null
          post_transfusion_vitals?: Json | null
          pre_transfusion_vitals?: Json | null
          reactions?: string | null
          started_at?: string | null
          updated_at?: string
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_transfusions_blood_unit_id_fkey"
            columns: ["blood_unit_id"]
            isOneToOne: false
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_transfusions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_units: {
        Row: {
          blood_group: string | null
          collection_date: string
          component_type: string
          created_at: string
          donor_id: string | null
          expiry_date: string
          hospital_id: string
          id: string
          notes: string | null
          rh_factor: string | null
          status: string
          unit_number: string
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          blood_group?: string | null
          collection_date: string
          component_type: string
          created_at?: string
          donor_id?: string | null
          expiry_date: string
          hospital_id: string
          id?: string
          notes?: string | null
          rh_factor?: string | null
          status?: string
          unit_number: string
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          blood_group?: string | null
          collection_date?: string
          component_type?: string
          created_at?: string
          donor_id?: string | null
          expiry_date?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          rh_factor?: string | null
          status?: string
          unit_number?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_units_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_units_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      child_immunizations: {
        Row: {
          batch_number: string | null
          child_patient_id: string
          created_at: string
          dose_number: number
          given_by: string | null
          given_date: string | null
          hospital_id: string
          id: string
          kepi_id: string | null
          notes: string | null
          scheduled_date: string | null
          updated_at: string
          vaccine: string
        }
        Insert: {
          batch_number?: string | null
          child_patient_id: string
          created_at?: string
          dose_number: number
          given_by?: string | null
          given_date?: string | null
          hospital_id: string
          id?: string
          kepi_id?: string | null
          notes?: string | null
          scheduled_date?: string | null
          updated_at?: string
          vaccine: string
        }
        Update: {
          batch_number?: string | null
          child_patient_id?: string
          created_at?: string
          dose_number?: number
          given_by?: string | null
          given_date?: string | null
          hospital_id?: string
          id?: string
          kepi_id?: string | null
          notes?: string | null
          scheduled_date?: string | null
          updated_at?: string
          vaccine?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_immunizations_kepi_id_fkey"
            columns: ["kepi_id"]
            isOneToOne: false
            referencedRelation: "kepi_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_audit_log: {
        Row: {
          accessed_columns: string[] | null
          action: string
          actor_role: string | null
          actor_user_id: string
          created_at: string
          hospital_id: string
          id: string
          ip_address: unknown
          justification: string | null
          patient_id: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          accessed_columns?: string[] | null
          action: string
          actor_role?: string | null
          actor_user_id: string
          created_at?: string
          hospital_id: string
          id?: string
          ip_address?: unknown
          justification?: string | null
          patient_id?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          accessed_columns?: string[] | null
          action?: string
          actor_role?: string | null
          actor_user_id?: string
          created_at?: string
          hospital_id?: string
          id?: string
          ip_address?: unknown
          justification?: string | null
          patient_id?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      clinical_scores: {
        Row: {
          action_recommended: string | null
          calculated_at: string
          components: Json | null
          encounter_id: string | null
          hospital_id: string
          id: string
          patient_id: string
          score_type: string
          score_value: number
        }
        Insert: {
          action_recommended?: string | null
          calculated_at?: string
          components?: Json | null
          encounter_id?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          score_type: string
          score_value: number
        }
        Update: {
          action_recommended?: string | null
          calculated_at?: string
          components?: Json | null
          encounter_id?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          score_type?: string
          score_value?: number
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          created_at: string
          diagnosis_type: string
          hospital_id: string
          icd_code: string
          icd_description: string
          id: string
          medical_record_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          diagnosis_type?: string
          hospital_id: string
          icd_code: string
          icd_description: string
          id?: string
          medical_record_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          diagnosis_type?: string
          hospital_id?: string
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      drug_interactions: {
        Row: {
          code_system: string
          created_at: string
          description: string
          drug_a_code: string
          drug_a_name: string
          drug_b_code: string
          drug_b_name: string
          id: string
          management: string | null
          severity: string
        }
        Insert: {
          code_system?: string
          created_at?: string
          description: string
          drug_a_code: string
          drug_a_name: string
          drug_b_code: string
          drug_b_name: string
          id?: string
          management?: string | null
          severity: string
        }
        Update: {
          code_system?: string
          created_at?: string
          description?: string
          drug_a_code?: string
          drug_a_name?: string
          drug_b_code?: string
          drug_b_name?: string
          id?: string
          management?: string | null
          severity?: string
        }
        Relationships: []
      }
      geographic_areas: {
        Row: {
          code: string | null
          country_code: string | null
          created_at: string
          id: string
          level: string
          name: string
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          level: string
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          level?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geographic_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "geographic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_monitoring: {
        Row: {
          age_months: number | null
          child_patient_id: string
          created_at: string
          height_cm: number | null
          hfa_z: number | null
          hospital_id: string
          id: string
          muac_cm: number | null
          nutrition_status: string | null
          recorded_by: string | null
          visit_date: string
          weight_kg: number | null
          wfa_z: number | null
          wfh_z: number | null
        }
        Insert: {
          age_months?: number | null
          child_patient_id: string
          created_at?: string
          height_cm?: number | null
          hfa_z?: number | null
          hospital_id: string
          id?: string
          muac_cm?: number | null
          nutrition_status?: string | null
          recorded_by?: string | null
          visit_date?: string
          weight_kg?: number | null
          wfa_z?: number | null
          wfh_z?: number | null
        }
        Update: {
          age_months?: number | null
          child_patient_id?: string
          created_at?: string
          height_cm?: number | null
          hfa_z?: number | null
          hospital_id?: string
          id?: string
          muac_cm?: number | null
          nutrition_status?: string | null
          recorded_by?: string | null
          visit_date?: string
          weight_kg?: number | null
          wfa_z?: number | null
          wfh_z?: number | null
        }
        Relationships: []
      }
      hiv_enrollments: {
        Row: {
          art_eligible: boolean | null
          baseline_cd4: number | null
          baseline_vl: number | null
          ccc_number: string | null
          created_at: string
          enrollment_date: string
          hospital_id: string
          id: string
          notes: string | null
          partner_testing_done: boolean | null
          patient_id: string
          updated_at: string
          who_stage: number | null
        }
        Insert: {
          art_eligible?: boolean | null
          baseline_cd4?: number | null
          baseline_vl?: number | null
          ccc_number?: string | null
          created_at?: string
          enrollment_date?: string
          hospital_id: string
          id?: string
          notes?: string | null
          partner_testing_done?: boolean | null
          patient_id: string
          updated_at?: string
          who_stage?: number | null
        }
        Update: {
          art_eligible?: boolean | null
          baseline_cd4?: number | null
          baseline_vl?: number | null
          ccc_number?: string | null
          created_at?: string
          enrollment_date?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          partner_testing_done?: boolean | null
          patient_id?: string
          updated_at?: string
          who_stage?: number | null
        }
        Relationships: []
      }
      hospital_members: {
        Row: {
          hospital_id: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string
          mfa_grace_period_end: string | null
          mfa_required: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          hospital_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          mfa_grace_period_end?: string | null
          mfa_required?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          hospital_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          mfa_grace_period_end?: string | null
          mfa_required?: boolean
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
      hospital_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          features: Json | null
          hospital_id: string
          id: string
          max_patients: number | null
          max_users: number | null
          monthly_fee: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          features?: Json | null
          hospital_id: string
          id?: string
          max_patients?: number | null
          max_users?: number | null
          monthly_fee?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          features?: Json | null
          hospital_id?: string
          id?: string
          max_patients?: number | null
          max_users?: number | null
          monthly_fee?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_subscriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: true
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      idsr_notifications: {
        Row: {
          condition_id: string | null
          created_at: string
          diagnosed_date: string
          hospital_id: string
          id: string
          notification_method: string | null
          notified_by: string | null
          notified_date: string | null
          patient_id: string | null
          recipient_authority: string | null
          response_notes: string | null
          response_received: boolean | null
          source_diagnosis_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          condition_id?: string | null
          created_at?: string
          diagnosed_date?: string
          hospital_id: string
          id?: string
          notification_method?: string | null
          notified_by?: string | null
          notified_date?: string | null
          patient_id?: string | null
          recipient_authority?: string | null
          response_notes?: string | null
          response_received?: boolean | null
          source_diagnosis_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          condition_id?: string | null
          created_at?: string
          diagnosed_date?: string
          hospital_id?: string
          id?: string
          notification_method?: string | null
          notified_by?: string | null
          notified_date?: string | null
          patient_id?: string | null
          recipient_authority?: string | null
          response_notes?: string | null
          response_received?: boolean | null
          source_diagnosis_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idsr_notifications_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "notifiable_conditions_registry"
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      kepi_schedule: {
        Row: {
          age_weeks: number
          dose_number: number
          id: string
          notes: string | null
          route: string | null
          site: string | null
          vaccine: string
        }
        Insert: {
          age_weeks: number
          dose_number: number
          id: string
          notes?: string | null
          route?: string | null
          site?: string | null
          vaccine: string
        }
        Update: {
          age_weeks?: number
          dose_number?: number
          id?: string
          notes?: string | null
          route?: string | null
          site?: string | null
          vaccine?: string
        }
        Relationships: []
      }
      lab_orders: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      lab_panels: {
        Row: {
          created_at: string
          description: string | null
          hospital_id: string | null
          id: string
          included_tests: string[]
          is_global: boolean
          panel_code: string
          panel_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          included_tests?: string[]
          is_global?: boolean
          panel_code: string
          panel_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          included_tests?: string[]
          is_global?: boolean
          panel_code?: string
          panel_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_panels_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          flag: string | null
          hospital_id: string
          id: string
          instrument: string | null
          lab_order_id: string
          loinc_code: string | null
          method: string | null
          notes: string | null
          patient_id: string
          reference_range_high: number | null
          reference_range_low: number | null
          reference_range_text: string | null
          result_numeric: number | null
          result_status: string
          result_unit: string | null
          result_value: string
          test_code: string | null
          test_name: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          flag?: string | null
          hospital_id: string
          id?: string
          instrument?: string | null
          lab_order_id: string
          loinc_code?: string | null
          method?: string | null
          notes?: string | null
          patient_id: string
          reference_range_high?: number | null
          reference_range_low?: number | null
          reference_range_text?: string | null
          result_numeric?: number | null
          result_status?: string
          result_unit?: string | null
          result_value: string
          test_code?: string | null
          test_name: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          flag?: string | null
          hospital_id?: string
          id?: string
          instrument?: string | null
          lab_order_id?: string
          loinc_code?: string | null
          method?: string | null
          notes?: string | null
          patient_id?: string
          reference_range_high?: number | null
          reference_range_low?: number | null
          reference_range_text?: string | null
          result_numeric?: number | null
          result_status?: string
          result_unit?: string | null
          result_value?: string
          test_code?: string | null
          test_name?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_specimens: {
        Row: {
          collected_by: string | null
          collection_datetime: string
          condition: string | null
          container: string | null
          created_at: string
          hospital_id: string
          id: string
          lab_order_id: string
          rejection_reason: string | null
          specimen_type: string
          volume_ml: number | null
        }
        Insert: {
          collected_by?: string | null
          collection_datetime?: string
          condition?: string | null
          container?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          lab_order_id: string
          rejection_reason?: string | null
          specimen_type: string
          volume_ml?: number | null
        }
        Update: {
          collected_by?: string | null
          collection_datetime?: string
          condition?: string | null
          container?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          lab_order_id?: string
          rejection_reason?: string | null
          specimen_type?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_specimens_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_anc_visits: {
        Row: {
          attended_by: string | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          complications: string | null
          created_at: string
          fetal_heart_rate: number | null
          fetal_movements: string | null
          fundal_height_cm: number | null
          gestational_age_weeks: number | null
          hb_level: number | null
          hiv_status: string | null
          hospital_id: string
          id: string
          ifas_given: boolean | null
          malaria_status: string | null
          mosquito_net_given: boolean | null
          next_visit_date: string | null
          patient_id: string
          plan: string | null
          syphilis_status: string | null
          tt_dose: number | null
          updated_at: string
          urine_glucose: string | null
          urine_protein: string | null
          visit_date: string
          visit_number: number
          weight: number | null
        }
        Insert: {
          attended_by?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          complications?: string | null
          created_at?: string
          fetal_heart_rate?: number | null
          fetal_movements?: string | null
          fundal_height_cm?: number | null
          gestational_age_weeks?: number | null
          hb_level?: number | null
          hiv_status?: string | null
          hospital_id: string
          id?: string
          ifas_given?: boolean | null
          malaria_status?: string | null
          mosquito_net_given?: boolean | null
          next_visit_date?: string | null
          patient_id: string
          plan?: string | null
          syphilis_status?: string | null
          tt_dose?: number | null
          updated_at?: string
          urine_glucose?: string | null
          urine_protein?: string | null
          visit_date?: string
          visit_number?: number
          weight?: number | null
        }
        Update: {
          attended_by?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          complications?: string | null
          created_at?: string
          fetal_heart_rate?: number | null
          fetal_movements?: string | null
          fundal_height_cm?: number | null
          gestational_age_weeks?: number | null
          hb_level?: number | null
          hiv_status?: string | null
          hospital_id?: string
          id?: string
          ifas_given?: boolean | null
          malaria_status?: string | null
          mosquito_net_given?: boolean | null
          next_visit_date?: string | null
          patient_id?: string
          plan?: string | null
          syphilis_status?: string | null
          tt_dose?: number | null
          updated_at?: string
          urine_glucose?: string | null
          urine_protein?: string | null
          visit_date?: string
          visit_number?: number
          weight?: number | null
        }
        Relationships: []
      }
      mch_deliveries: {
        Row: {
          apgar_1min: number | null
          apgar_5min: number | null
          attended_by: string | null
          birth_weight_g: number | null
          complications: string | null
          created_at: string
          delivery_date: string
          delivery_time: string | null
          gestational_age_weeks: number | null
          hospital_id: string
          id: string
          mode: string | null
          outcome: string | null
          patient_id: string
          place: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          apgar_1min?: number | null
          apgar_5min?: number | null
          attended_by?: string | null
          birth_weight_g?: number | null
          complications?: string | null
          created_at?: string
          delivery_date?: string
          delivery_time?: string | null
          gestational_age_weeks?: number | null
          hospital_id: string
          id?: string
          mode?: string | null
          outcome?: string | null
          patient_id: string
          place?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          apgar_1min?: number | null
          apgar_5min?: number | null
          attended_by?: string | null
          birth_weight_g?: number | null
          complications?: string | null
          created_at?: string
          delivery_date?: string
          delivery_time?: string | null
          gestational_age_weeks?: number | null
          hospital_id?: string
          id?: string
          mode?: string | null
          outcome?: string | null
          patient_id?: string
          place?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mch_postnatal_visits: {
        Row: {
          attended_by: string | null
          baby_cord_status: string | null
          baby_feeding: string | null
          baby_jaundice: boolean | null
          baby_temperature: number | null
          baby_weight_g: number | null
          breastfeeding_status: string | null
          complications: string | null
          created_at: string
          family_planning_counseled: boolean | null
          family_planning_method: string | null
          hospital_id: string
          id: string
          mother_bleeding: string | null
          mother_bp_diastolic: number | null
          mother_bp_systolic: number | null
          mother_temperature: number | null
          patient_id: string
          perineum_status: string | null
          plan: string | null
          updated_at: string
          uterine_involution: string | null
          visit_date: string
          visit_timepoint: string
        }
        Insert: {
          attended_by?: string | null
          baby_cord_status?: string | null
          baby_feeding?: string | null
          baby_jaundice?: boolean | null
          baby_temperature?: number | null
          baby_weight_g?: number | null
          breastfeeding_status?: string | null
          complications?: string | null
          created_at?: string
          family_planning_counseled?: boolean | null
          family_planning_method?: string | null
          hospital_id: string
          id?: string
          mother_bleeding?: string | null
          mother_bp_diastolic?: number | null
          mother_bp_systolic?: number | null
          mother_temperature?: number | null
          patient_id: string
          perineum_status?: string | null
          plan?: string | null
          updated_at?: string
          uterine_involution?: string | null
          visit_date?: string
          visit_timepoint: string
        }
        Update: {
          attended_by?: string | null
          baby_cord_status?: string | null
          baby_feeding?: string | null
          baby_jaundice?: boolean | null
          baby_temperature?: number | null
          baby_weight_g?: number | null
          breastfeeding_status?: string | null
          complications?: string | null
          created_at?: string
          family_planning_counseled?: boolean | null
          family_planning_method?: string | null
          hospital_id?: string
          id?: string
          mother_bleeding?: string | null
          mother_bp_diastolic?: number | null
          mother_bp_systolic?: number | null
          mother_temperature?: number | null
          patient_id?: string
          perineum_status?: string | null
          plan?: string | null
          updated_at?: string
          uterine_involution?: string | null
          visit_date?: string
          visit_timepoint?: string
        }
        Relationships: []
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      medication_batches: {
        Row: {
          barcode: string | null
          batch_number: string
          created_at: string
          expiry_date: string
          hospital_id: string
          id: string
          lot_number: string | null
          manufacturing_date: string | null
          medication_id: string
          notes: string | null
          quantity_received: number
          quantity_remaining: number
          received_by: string | null
          received_date: string
          status: string
          storage_location: string | null
          supplier: string | null
          supplier_invoice: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          batch_number: string
          created_at?: string
          expiry_date: string
          hospital_id: string
          id?: string
          lot_number?: string | null
          manufacturing_date?: string | null
          medication_id: string
          notes?: string | null
          quantity_received: number
          quantity_remaining: number
          received_by?: string | null
          received_date?: string
          status?: string
          storage_location?: string | null
          supplier?: string | null
          supplier_invoice?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          batch_number?: string
          created_at?: string
          expiry_date?: string
          hospital_id?: string
          id?: string
          lot_number?: string | null
          manufacturing_date?: string | null
          medication_id?: string
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          received_by?: string | null
          received_date?: string
          status?: string
          storage_location?: string | null
          supplier?: string | null
          supplier_invoice?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_batches_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_batches_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medication_stock"
            referencedColumns: ["medication_id"]
          },
          {
            foreignKeyName: "medication_batches_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_dispenses: {
        Row: {
          batch_id: string
          counseling_notes: string | null
          created_at: string
          dispensed_at: string
          dispensed_by: string | null
          hospital_id: string
          id: string
          patient_id: string
          prescription_id: string
          quantity_dispensed: number
        }
        Insert: {
          batch_id: string
          counseling_notes?: string | null
          created_at?: string
          dispensed_at?: string
          dispensed_by?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          prescription_id: string
          quantity_dispensed: number
        }
        Update: {
          batch_id?: string
          counseling_notes?: string | null
          created_at?: string
          dispensed_at?: string
          dispensed_by?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          prescription_id?: string
          quantity_dispensed?: number
        }
        Relationships: [
          {
            foreignKeyName: "medication_dispenses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medication_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispenses_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          atc_code: string | null
          category: string
          created_at: string
          dosage_form: string
          drug_class: string | null
          expiry_date: string | null
          generic_name: string | null
          hospital_id: string
          id: string
          is_active: boolean
          manufacturer: string | null
          name: string
          reorder_level: number
          stock_quantity: number
          strength: string | null
          substance: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          atc_code?: string | null
          category?: string
          created_at?: string
          dosage_form?: string
          drug_class?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          substance?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          atc_code?: string | null
          category?: string
          created_at?: string
          dosage_form?: string
          drug_class?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name?: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          substance?: string | null
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
      mortuary_intakes: {
        Row: {
          body_id: string
          brought_in_by: string | null
          brought_in_contact: string | null
          cause_of_death: string | null
          created_at: string
          deceased_name: string | null
          deceased_patient_id: string | null
          deceased_sex: string | null
          estimated_age: number | null
          hospital_id: string
          id: string
          identifying_features: string | null
          intake_by: string | null
          intake_datetime: string
          police_report_number: string | null
          post_mortem_required: boolean | null
          refrigeration_unit: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body_id: string
          brought_in_by?: string | null
          brought_in_contact?: string | null
          cause_of_death?: string | null
          created_at?: string
          deceased_name?: string | null
          deceased_patient_id?: string | null
          deceased_sex?: string | null
          estimated_age?: number | null
          hospital_id: string
          id?: string
          identifying_features?: string | null
          intake_by?: string | null
          intake_datetime?: string
          police_report_number?: string | null
          post_mortem_required?: boolean | null
          refrigeration_unit?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body_id?: string
          brought_in_by?: string | null
          brought_in_contact?: string | null
          cause_of_death?: string | null
          created_at?: string
          deceased_name?: string | null
          deceased_patient_id?: string | null
          deceased_sex?: string | null
          estimated_age?: number | null
          hospital_id?: string
          id?: string
          identifying_features?: string | null
          intake_by?: string | null
          intake_datetime?: string
          police_report_number?: string | null
          post_mortem_required?: boolean | null
          refrigeration_unit?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_intakes_deceased_patient_id_fkey"
            columns: ["deceased_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_intakes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      mortuary_releases: {
        Row: {
          burial_permit_number: string | null
          created_at: string
          hospital_id: string
          id: string
          mortuary_intake_id: string
          notes: string | null
          release_datetime: string
          released_by: string | null
          released_to_id: string | null
          released_to_name: string
          released_to_phone: string | null
          released_to_relationship: string | null
        }
        Insert: {
          burial_permit_number?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          mortuary_intake_id: string
          notes?: string | null
          release_datetime?: string
          released_by?: string | null
          released_to_id?: string | null
          released_to_name: string
          released_to_phone?: string | null
          released_to_relationship?: string | null
        }
        Update: {
          burial_permit_number?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          mortuary_intake_id?: string
          notes?: string | null
          release_datetime?: string
          released_by?: string | null
          released_to_id?: string | null
          released_to_name?: string
          released_to_phone?: string | null
          released_to_relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_releases_mortuary_intake_id_fkey"
            columns: ["mortuary_intake_id"]
            isOneToOne: false
            referencedRelation: "mortuary_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifiable_conditions_registry: {
        Row: {
          condition_name: string
          created_at: string
          icd_codes: string[]
          id: string
          notes: string | null
          notification_window_hours: number
          reporting_form: string | null
          requires_immediate: boolean
        }
        Insert: {
          condition_name: string
          created_at?: string
          icd_codes?: string[]
          id: string
          notes?: string | null
          notification_window_hours?: number
          reporting_form?: string | null
          requires_immediate?: boolean
        }
        Update: {
          condition_name?: string
          created_at?: string
          icd_codes?: string[]
          id?: string
          notes?: string | null
          notification_window_hours?: number
          reporting_form?: string | null
          requires_immediate?: boolean
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
      order_set_items: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_type: string
          order_set_id: string
          sequence: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_data: Json
          item_type: string
          order_set_id: string
          sequence?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_type?: string
          order_set_id?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_set_items_order_set_id_fkey"
            columns: ["order_set_id"]
            isOneToOne: false
            referencedRelation: "order_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sets: {
        Row: {
          category: string | null
          clinical_pathway: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hospital_id: string | null
          id: string
          is_template: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinical_pathway?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_template?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinical_pathway?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_template?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ot_rooms: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          room_number: string
          room_type: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          room_number: string
          room_type?: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          room_number?: string
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_rooms_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_addresses: {
        Row: {
          address_type: string | null
          building: string | null
          country: string
          county: string | null
          created_at: string
          geocoded_lat: number | null
          geocoded_lng: number | null
          hospital_id: string
          id: string
          is_current: boolean | null
          patient_id: string
          postal_code: string | null
          region: string | null
          street: string | null
          sub_county: string | null
          updated_at: string
          village: string | null
          ward: string | null
        }
        Insert: {
          address_type?: string | null
          building?: string | null
          country: string
          county?: string | null
          created_at?: string
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          hospital_id: string
          id?: string
          is_current?: boolean | null
          patient_id: string
          postal_code?: string | null
          region?: string | null
          street?: string | null
          sub_county?: string | null
          updated_at?: string
          village?: string | null
          ward?: string | null
        }
        Update: {
          address_type?: string | null
          building?: string | null
          country?: string
          county?: string | null
          created_at?: string
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          hospital_id?: string
          id?: string
          is_current?: boolean | null
          patient_id?: string
          postal_code?: string | null
          region?: string | null
          street?: string | null
          sub_county?: string | null
          updated_at?: string
          village?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_addresses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_allergies: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          onset_date: string | null
          patient_id: string
          reaction: string | null
          severity: string | null
          status: string | null
          substance: string
          substance_code: string | null
          substance_code_system: string | null
          updated_at: string
          verification_date: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          reaction?: string | null
          severity?: string | null
          status?: string | null
          substance: string
          substance_code?: string | null
          substance_code_system?: string | null
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          reaction?: string | null
          severity?: string | null
          status?: string | null
          substance?: string
          substance_code?: string | null
          substance_code_system?: string | null
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_conditions: {
        Row: {
          created_at: string
          hospital_id: string
          icd_code: string
          icd_description: string
          icd_version: string | null
          id: string
          notes: string | null
          onset_date: string | null
          patient_id: string
          recorded_by: string | null
          recorded_date: string | null
          resolved_date: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          icd_code: string
          icd_description: string
          icd_version?: string | null
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          recorded_by?: string | null
          recorded_date?: string | null
          resolved_date?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          icd_code?: string
          icd_description?: string
          icd_version?: string | null
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          recorded_by?: string | null
          recorded_date?: string | null
          resolved_date?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          consent_form_version: string | null
          consent_type: string
          created_at: string
          document_url: string | null
          expires_at: string | null
          granted_at: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          revoked_at: string | null
          status: string
          updated_at: string
          witnessed_by: string | null
        }
        Insert: {
          consent_form_version?: string | null
          consent_type: string
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          granted_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          witnessed_by?: string | null
        }
        Update: {
          consent_form_version?: string | null
          consent_type?: string
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          granted_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_contacts: {
        Row: {
          contact_type: string
          created_at: string
          hospital_id: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          opt_in_email: boolean | null
          opt_in_sms: boolean | null
          opt_in_whatsapp: boolean | null
          patient_id: string
          updated_at: string
          value: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          hospital_id: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          opt_in_email?: boolean | null
          opt_in_sms?: boolean | null
          opt_in_whatsapp?: boolean | null
          patient_id: string
          updated_at?: string
          value: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          hospital_id?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          opt_in_email?: boolean | null
          opt_in_sms?: boolean | null
          opt_in_whatsapp?: boolean | null
          patient_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_identifiers: {
        Row: {
          created_at: string
          expiry_date: string | null
          hospital_id: string
          id: string
          identifier_country: string | null
          identifier_type: string
          identifier_value: string
          is_primary: boolean | null
          issued_date: string | null
          issuing_authority: string | null
          patient_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          hospital_id: string
          id?: string
          identifier_country?: string | null
          identifier_type: string
          identifier_value: string
          is_primary?: boolean | null
          issued_date?: string | null
          issuing_authority?: string | null
          patient_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          hospital_id?: string
          id?: string
          identifier_country?: string | null
          identifier_type?: string
          identifier_value?: string
          is_primary?: boolean | null
          issued_date?: string | null
          issuing_authority?: string | null
          patient_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_identifiers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_queue: {
        Row: {
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          priority: number
          queued_at: string
          served_at: string | null
          service_point_id: string
          status: string
          ticket_number: string
        }
        Insert: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          priority?: number
          queued_at?: string
          served_at?: string | null
          service_point_id: string
          status?: string
          ticket_number: string
        }
        Update: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: number
          queued_at?: string
          served_at?: string | null
          service_point_id?: string
          status?: string
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_queue_service_point_id_fkey"
            columns: ["service_point_id"]
            isOneToOne: false
            referencedRelation: "service_points"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_relationships: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          hospital_id: string
          id: string
          is_emergency_contact: boolean | null
          is_legal_decision_maker: boolean | null
          notes: string | null
          patient_id: string
          phone: string | null
          related_person_name: string
          relationship: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          hospital_id: string
          id?: string
          is_emergency_contact?: boolean | null
          is_legal_decision_maker?: boolean | null
          notes?: string | null
          patient_id: string
          phone?: string | null
          related_person_name: string
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          hospital_id?: string
          id?: string
          is_emergency_contact?: boolean | null
          is_legal_decision_maker?: boolean | null
          notes?: string | null
          patient_id?: string
          phone?: string | null
          related_person_name?: string
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_relationships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_social_history: {
        Row: {
          alcohol_use: string | null
          created_at: string
          distance_to_facility_km: number | null
          electricity_access: boolean | null
          hospital_id: string
          household_size: number | null
          id: string
          pack_years: number | null
          patient_id: string
          recorded_by: string | null
          recorded_date: string | null
          smoking_status: string | null
          substance_use: string | null
          updated_at: string
          water_source: string | null
        }
        Insert: {
          alcohol_use?: string | null
          created_at?: string
          distance_to_facility_km?: number | null
          electricity_access?: boolean | null
          hospital_id: string
          household_size?: number | null
          id?: string
          pack_years?: number | null
          patient_id: string
          recorded_by?: string | null
          recorded_date?: string | null
          smoking_status?: string | null
          substance_use?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Update: {
          alcohol_use?: string | null
          created_at?: string
          distance_to_facility_km?: number | null
          electricity_access?: boolean | null
          hospital_id?: string
          household_size?: number | null
          id?: string
          pack_years?: number | null
          patient_id?: string
          recorded_by?: string | null
          recorded_date?: string | null
          smoking_status?: string | null
          substance_use?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_social_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_women_health: {
        Row: {
          abortions: number | null
          contraception_method: string | null
          created_at: string
          gestational_age_weeks: number | null
          gravida: number | null
          hospital_id: string
          id: string
          is_breastfeeding: boolean | null
          is_pregnant: boolean | null
          last_menstrual_period: string | null
          last_updated_at: string | null
          last_updated_by: string | null
          menarche_age: number | null
          menopause_age: number | null
          parity: number | null
          patient_id: string
        }
        Insert: {
          abortions?: number | null
          contraception_method?: string | null
          created_at?: string
          gestational_age_weeks?: number | null
          gravida?: number | null
          hospital_id: string
          id?: string
          is_breastfeeding?: boolean | null
          is_pregnant?: boolean | null
          last_menstrual_period?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          menarche_age?: number | null
          menopause_age?: number | null
          parity?: number | null
          patient_id: string
        }
        Update: {
          abortions?: number | null
          contraception_method?: string | null
          created_at?: string
          gestational_age_weeks?: number | null
          gravida?: number | null
          hospital_id?: string
          id?: string
          is_breastfeeding?: boolean | null
          is_pregnant?: boolean | null
          last_menstrual_period?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          menarche_age?: number | null
          menopause_age?: number | null
          parity?: number | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_women_health_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
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
          cause_of_death_contributing: string | null
          cause_of_death_immediate: string | null
          cause_of_death_underlying: string | null
          certifying_doctor_id: string | null
          chronic_conditions: string[] | null
          country_of_origin: string | null
          created_at: string
          created_by: string | null
          current_medications: Json | null
          date_of_birth: string
          date_of_death: string | null
          education_level: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_name: string
          first_name: string
          gender: string
          gender_identity: string | null
          given_names: string[]
          hospital_id: string
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          is_deceased: boolean | null
          last_name: string
          manner_of_death: string | null
          marital_status: string | null
          name_script: string | null
          notes: string | null
          occupation: string | null
          occupation_code: string | null
          other_names: string[] | null
          patient_id: string
          phone: string | null
          photo_url: string | null
          place_of_death: string | null
          preferred_language: string | null
          preferred_name: string | null
          pronouns: string | null
          refugee_status: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          sex_at_birth: string
          status: string | null
          time_of_death: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          address?: string | null
          ai_risk_score?: number | null
          allergies?: string[] | null
          blood_type?: string | null
          cause_of_death_contributing?: string | null
          cause_of_death_immediate?: string | null
          cause_of_death_underlying?: string | null
          certifying_doctor_id?: string | null
          chronic_conditions?: string[] | null
          country_of_origin?: string | null
          created_at?: string
          created_by?: string | null
          current_medications?: Json | null
          date_of_birth: string
          date_of_death?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_name: string
          first_name: string
          gender: string
          gender_identity?: string | null
          given_names?: string[]
          hospital_id: string
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_deceased?: boolean | null
          last_name: string
          manner_of_death?: string | null
          marital_status?: string | null
          name_script?: string | null
          notes?: string | null
          occupation?: string | null
          occupation_code?: string | null
          other_names?: string[] | null
          patient_id?: string
          phone?: string | null
          photo_url?: string | null
          place_of_death?: string | null
          preferred_language?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          refugee_status?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          sex_at_birth?: string
          status?: string | null
          time_of_death?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          address?: string | null
          ai_risk_score?: number | null
          allergies?: string[] | null
          blood_type?: string | null
          cause_of_death_contributing?: string | null
          cause_of_death_immediate?: string | null
          cause_of_death_underlying?: string | null
          certifying_doctor_id?: string | null
          chronic_conditions?: string[] | null
          country_of_origin?: string | null
          created_at?: string
          created_by?: string | null
          current_medications?: Json | null
          date_of_birth?: string
          date_of_death?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_name?: string
          first_name?: string
          gender?: string
          gender_identity?: string | null
          given_names?: string[]
          hospital_id?: string
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_deceased?: boolean | null
          last_name?: string
          manner_of_death?: string | null
          marital_status?: string | null
          name_script?: string | null
          notes?: string | null
          occupation?: string | null
          occupation_code?: string | null
          other_names?: string[] | null
          patient_id?: string
          phone?: string | null
          photo_url?: string | null
          place_of_death?: string | null
          preferred_language?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          refugee_status?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          sex_at_birth?: string
          status?: string | null
          time_of_death?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_certifying_doctor_id_fkey"
            columns: ["certifying_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
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
      platform_admins: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      prescription_overrides: {
        Row: {
          acknowledged_at: string
          acknowledged_by: string
          hospital_id: string
          id: string
          justification: string
          override_type: string
          prescription_id: string
          warning_details: Json
        }
        Insert: {
          acknowledged_at?: string
          acknowledged_by: string
          hospital_id: string
          id?: string
          justification: string
          override_type: string
          prescription_id: string
          warning_details: Json
        }
        Update: {
          acknowledged_at?: string
          acknowledged_by?: string
          hospital_id?: string
          id?: string
          justification?: string
          override_type?: string
          prescription_id?: string
          warning_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prescription_overrides_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
            referencedRelation: "medication_stock"
            referencedColumns: ["medication_id"]
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
      service_points: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_points_hospital_id_fkey"
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
      surgeries: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          anaesthesia_type: string | null
          anaesthetist_id: string | null
          blood_loss_ml: number | null
          complications: string | null
          created_at: string
          hospital_id: string
          id: string
          intra_op_notes: string | null
          ot_room_id: string | null
          patient_id: string
          post_op_notes: string | null
          pre_op_notes: string | null
          procedure_code: string | null
          procedure_name: string
          scheduled_end: string | null
          scheduled_start: string
          scrub_nurse_id: string | null
          specimens_taken: string[] | null
          status: string
          surgeon_id: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthesia_type?: string | null
          anaesthetist_id?: string | null
          blood_loss_ml?: number | null
          complications?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          intra_op_notes?: string | null
          ot_room_id?: string | null
          patient_id: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          procedure_code?: string | null
          procedure_name: string
          scheduled_end?: string | null
          scheduled_start: string
          scrub_nurse_id?: string | null
          specimens_taken?: string[] | null
          status?: string
          surgeon_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthesia_type?: string | null
          anaesthetist_id?: string | null
          blood_loss_ml?: number | null
          complications?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          intra_op_notes?: string | null
          ot_room_id?: string | null
          patient_id?: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          procedure_code?: string | null
          procedure_name?: string
          scheduled_end?: string | null
          scheduled_start?: string
          scrub_nurse_id?: string | null
          specimens_taken?: string[] | null
          status?: string
          surgeon_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_anaesthetist_id_fkey"
            columns: ["anaesthetist_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_ot_room_id_fkey"
            columns: ["ot_room_id"]
            isOneToOne: false
            referencedRelation: "ot_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      surgical_safety_checklist: {
        Row: {
          created_at: string
          hospital_id: string
          sign_in_at: string | null
          sign_in_by: string | null
          sign_in_completed: boolean
          sign_in_data: Json | null
          sign_out_at: string | null
          sign_out_by: string | null
          sign_out_completed: boolean
          sign_out_data: Json | null
          surgery_id: string
          time_out_at: string | null
          time_out_by: string | null
          time_out_completed: boolean
          time_out_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          sign_in_at?: string | null
          sign_in_by?: string | null
          sign_in_completed?: boolean
          sign_in_data?: Json | null
          sign_out_at?: string | null
          sign_out_by?: string | null
          sign_out_completed?: boolean
          sign_out_data?: Json | null
          surgery_id: string
          time_out_at?: string | null
          time_out_by?: string | null
          time_out_completed?: boolean
          time_out_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          sign_in_at?: string | null
          sign_in_by?: string | null
          sign_in_completed?: boolean
          sign_in_data?: Json | null
          sign_out_at?: string | null
          sign_out_by?: string | null
          sign_out_completed?: boolean
          sign_out_data?: Json | null
          surgery_id?: string
          time_out_at?: string | null
          time_out_by?: string | null
          time_out_completed?: boolean
          time_out_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgical_safety_checklist_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: true
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_cases: {
        Row: {
          bacteriological_status: string | null
          created_at: string
          disease_site: string | null
          hiv_status: string | null
          hospital_id: string
          id: string
          notes: string | null
          outcome: string | null
          patient_id: string
          regimen: string | null
          registration_date: string
          registration_number: string | null
          treatment_end_date: string | null
          treatment_start_date: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          bacteriological_status?: string | null
          created_at?: string
          disease_site?: string | null
          hiv_status?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id: string
          regimen?: string | null
          registration_date?: string
          registration_number?: string | null
          treatment_end_date?: string | null
          treatment_start_date?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          bacteriological_status?: string | null
          created_at?: string
          disease_site?: string | null
          hiv_status?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          regimen?: string | null
          registration_date?: string
          registration_number?: string | null
          treatment_end_date?: string | null
          treatment_start_date?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tb_contacts: {
        Row: {
          age: number | null
          contact_name: string
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          relationship: string | null
          screening_date: string | null
          screening_result: string | null
          tb_case_id: string
          treatment_started: boolean | null
        }
        Insert: {
          age?: number | null
          contact_name: string
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          relationship?: string | null
          screening_date?: string | null
          screening_result?: string | null
          tb_case_id: string
          treatment_started?: boolean | null
        }
        Update: {
          age?: number | null
          contact_name?: string
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          relationship?: string | null
          screening_date?: string | null
          screening_result?: string | null
          tb_case_id?: string
          treatment_started?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_contacts_tb_case_id_fkey"
            columns: ["tb_case_id"]
            isOneToOne: false
            referencedRelation: "tb_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_dot_visits: {
        Row: {
          adverse_events: string | null
          created_at: string
          doses_missed: number | null
          doses_taken: number | null
          hospital_id: string
          id: string
          notes: string | null
          tb_case_id: string
          visit_date: string
          visited_by: string | null
        }
        Insert: {
          adverse_events?: string | null
          created_at?: string
          doses_missed?: number | null
          doses_taken?: number | null
          hospital_id: string
          id?: string
          notes?: string | null
          tb_case_id: string
          visit_date?: string
          visited_by?: string | null
        }
        Update: {
          adverse_events?: string | null
          created_at?: string
          doses_missed?: number | null
          doses_taken?: number | null
          hospital_id?: string
          id?: string
          notes?: string | null
          tb_case_id?: string
          visit_date?: string
          visited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_dot_visits_tb_case_id_fkey"
            columns: ["tb_case_id"]
            isOneToOne: false
            referencedRelation: "tb_cases"
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      viral_load_results: {
        Row: {
          copies_per_ml: number | null
          created_at: string
          hospital_id: string
          id: string
          lab_facility: string | null
          notes: string | null
          patient_id: string
          result_date: string | null
          sample_date: string
          suppressed: boolean | null
          undetectable: boolean | null
        }
        Insert: {
          copies_per_ml?: number | null
          created_at?: string
          hospital_id: string
          id?: string
          lab_facility?: string | null
          notes?: string | null
          patient_id: string
          result_date?: string | null
          sample_date: string
          suppressed?: boolean | null
          undetectable?: boolean | null
        }
        Update: {
          copies_per_ml?: number | null
          created_at?: string
          hospital_id?: string
          id?: string
          lab_facility?: string | null
          notes?: string | null
          patient_id?: string
          result_date?: string | null
          sample_date?: string
          suppressed?: boolean | null
          undetectable?: boolean | null
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
          hospital_id: string
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
          hospital_id: string
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
          hospital_id?: string
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
      who_growth_standards: {
        Row: {
          age_months: number
          height_median: number
          height_sd: number
          id: string
          sex: string
          weight_median: number
          weight_sd: number
        }
        Insert: {
          age_months: number
          height_median: number
          height_sd: number
          id?: string
          sex: string
          weight_median: number
          weight_sd: number
        }
        Update: {
          age_months?: number
          height_median?: number
          height_sd?: number
          id?: string
          sex?: string
          weight_median?: number
          weight_sd?: number
        }
        Relationships: []
      }
    }
    Views: {
      medication_stock: {
        Row: {
          batch_count: number | null
          earliest_expiry: string | null
          hospital_id: string | null
          medication_id: string | null
          name: string | null
          total_available: number | null
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
    }
    Functions: {
      calculate_gcs: {
        Args: { eye: number; motor: number; verbal: number }
        Returns: Json
      }
      calculate_mews: {
        Args: {
          consciousness: string
          hr: number
          rr: number
          sbp: number
          temp: number
        }
        Returns: Json
      }
      calculate_news2: {
        Args: {
          consciousness: string
          hr: number
          on_oxygen: boolean
          rr: number
          sbp: number
          spo2: number
          temp: number
        }
        Returns: Json
      }
      calculate_pews: {
        Args: {
          age_months: number
          consciousness: string
          hr: number
          rr: number
          spo2: number
        }
        Returns: Json
      }
      calculate_qsofa: {
        Args: { consciousness: string; rr: number; sbp: number }
        Returns: Json
      }
      dispense_medication: {
        Args: {
          _counseling?: string
          _prescription_id: string
          _quantity: number
        }
        Returns: Json
      }
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
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      sweep_expired_batches: { Args: never; Returns: Json }
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
        | "moh_731"
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
      subscription_plan: "free" | "basic" | "professional" | "enterprise"
      subscription_status:
        | "active"
        | "trial"
        | "suspended"
        | "cancelled"
        | "past_due"
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
        "moh_731",
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
      subscription_plan: ["free", "basic", "professional", "enterprise"],
      subscription_status: [
        "active",
        "trial",
        "suspended",
        "cancelled",
        "past_due",
      ],
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
