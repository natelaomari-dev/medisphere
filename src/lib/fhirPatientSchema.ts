import { z } from "zod";

// ------ Enums ------
export const sexAtBirthOptions = ["male", "female", "intersex", "unknown"] as const;
export const maritalStatusOptions = ["single", "married", "cohabiting", "widowed", "divorced", "separated", "unknown"] as const;
export const educationLevelOptions = ["none", "primary", "secondary", "tertiary", "postgraduate", "unknown"] as const;
export const refugeeStatusOptions = ["citizen", "refugee", "asylum_seeker", "stateless", "other"] as const;
export const identifierTypeOptions = [
  "national_id", "passport", "birth_notification", "birth_certificate",
  "refugee_id", "driving_license", "sha_number", "nhif_number",
  "private_insurance", "employer_id", "other",
] as const;
export const contactTypeOptions = ["phone_personal", "phone_work", "phone_alternate", "email_personal", "email_work", "whatsapp", "other"] as const;
export const addressTypeOptions = ["home", "work", "temporary", "postal"] as const;
export const relationshipOptions = ["spouse", "parent", "child", "sibling", "guardian", "next_of_kin", "financially_responsible", "other"] as const;
export const allergySeverityOptions = ["mild", "moderate", "severe", "life_threatening"] as const;
export const smokingStatusOptions = ["never", "former", "current_light", "current_heavy", "unknown"] as const;
export const alcoholUseOptions = ["never", "occasional", "regular", "heavy", "unknown"] as const;
export const consentTypeOptions = ["treatment", "data_sharing", "ai_processing", "photography"] as const;

// ------ Schemas ------
export const identitySchema = z.object({
  given_names: z.array(z.string().trim().min(1)).min(1, "At least one given name required"),
  family_name: z.string().trim().min(1, "Family name required").max(100),
  other_names: z.array(z.string().trim()).optional().default([]),
  preferred_name: z.string().trim().max(100).optional().or(z.literal("")),
  name_script: z.string().default("Latn"),
  sex_at_birth: z.enum(sexAtBirthOptions),
  date_of_birth: z.string().min(1, "Date of birth required"),
  gender: z.string().default("Other"),
  gender_identity: z.string().max(100).optional().or(z.literal("")),
  pronouns: z.string().max(50).optional().or(z.literal("")),
  marital_status: z.enum(maritalStatusOptions).optional(),
  occupation: z.string().max(100).optional().or(z.literal("")),
  education_level: z.enum(educationLevelOptions).optional(),
  preferred_language: z.string().default("en"),
  country_of_origin: z.string().length(2).optional().or(z.literal("")),
  refugee_status: z.enum(refugeeStatusOptions).optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export const identifierItemSchema = z.object({
  identifier_type: z.enum(identifierTypeOptions),
  identifier_value: z.string().trim().min(1).max(100),
  identifier_country: z.string().max(2).optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
  issuing_authority: z.string().max(150).optional().or(z.literal("")),
});

export const contactItemSchema = z.object({
  contact_type: z.enum(contactTypeOptions),
  value: z.string().trim().min(1).max(200),
  is_primary: z.boolean().default(false),
  opt_in_sms: z.boolean().default(false),
  opt_in_whatsapp: z.boolean().default(false),
  opt_in_email: z.boolean().default(false),
});

export const addressItemSchema = z.object({
  address_type: z.enum(addressTypeOptions).default("home"),
  country: z.string().min(1, "Country required"),
  region: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  sub_county: z.string().optional().or(z.literal("")),
  ward: z.string().optional().or(z.literal("")),
  village: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  is_current: z.boolean().default(true),
});

export const relationshipItemSchema = z.object({
  related_person_name: z.string().trim().min(1).max(150),
  relationship: z.enum(relationshipOptions),
  is_emergency_contact: z.boolean().default(false),
  is_legal_decision_maker: z.boolean().default(false),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
});

export const allergyItemSchema = z.object({
  substance: z.string().trim().min(1).max(150),
  reaction: z.string().max(300).optional().or(z.literal("")),
  severity: z.enum(allergySeverityOptions).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const conditionItemSchema = z.object({
  icd_code: z.string().trim().min(1).max(20),
  icd_description: z.string().trim().min(1).max(300),
  onset_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const clinicalSchema = z.object({
  blood_type: z.string().max(5).optional().or(z.literal("")),
  allergies: z.array(allergyItemSchema).default([]),
  conditions: z.array(conditionItemSchema).default([]),
  current_medications: z.string().max(1000).optional().or(z.literal("")),
  social_history: z.object({
    smoking_status: z.enum(smokingStatusOptions).optional(),
    alcohol_use: z.enum(alcoholUseOptions).optional(),
    household_size: z.coerce.number().int().min(0).optional(),
    water_source: z.string().max(100).optional().or(z.literal("")),
    electricity_access: z.boolean().optional(),
    distance_to_facility_km: z.coerce.number().min(0).optional(),
  }).optional(),
});

export const womenHealthSchema = z.object({
  last_menstrual_period: z.string().optional().or(z.literal("")),
  gravida: z.coerce.number().int().min(0).optional(),
  parity: z.coerce.number().int().min(0).optional(),
  abortions: z.coerce.number().int().min(0).optional(),
  contraception_method: z.string().max(100).optional().or(z.literal("")),
  is_pregnant: z.boolean().optional(),
  gestational_age_weeks: z.coerce.number().int().min(0).max(50).optional(),
  is_breastfeeding: z.boolean().optional(),
});

export const consentItemSchema = z.object({
  consent_type: z.enum(consentTypeOptions),
  granted: z.boolean().default(false),
});

export const patientWizardSchema = z.object({
  identity: identitySchema,
  identifiers: z.array(identifierItemSchema).default([]),
  contacts: z.array(contactItemSchema).default([]),
  addresses: z.array(addressItemSchema).default([]),
  relationships: z.array(relationshipItemSchema).default([]),
  clinical: clinicalSchema,
  women_health: womenHealthSchema.optional(),
  insurance: z.array(identifierItemSchema).default([]),
  consents: z.array(consentItemSchema).default([]),
});

export type PatientWizardValues = z.infer<typeof patientWizardSchema>;

export const COUNTRY_OPTIONS = [
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "BI", name: "Burundi" },
  { code: "SS", name: "South Sudan" },
  { code: "ET", name: "Ethiopia" },
  { code: "SO", name: "Somalia" },
  { code: "SD", name: "Sudan" },
  { code: "CD", name: "DR Congo" },
  { code: "OTHER", name: "Other" },
];

export const LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "sw", name: "Swahili" },
  { code: "fr", name: "French" },
  { code: "am", name: "Amharic" },
  { code: "so", name: "Somali" },
  { code: "ar", name: "Arabic" },
];
