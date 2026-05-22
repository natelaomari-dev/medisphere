import { useState, useMemo } from "react";
import { useForm, useFieldArray, Controller, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patientWizardSchema, PatientWizardValues,
  sexAtBirthOptions, maritalStatusOptions, educationLevelOptions, refugeeStatusOptions,
  identifierTypeOptions, contactTypeOptions, addressTypeOptions, relationshipOptions,
  allergySeverityOptions, smokingStatusOptions, alcoholUseOptions, consentTypeOptions,
  COUNTRY_OPTIONS, LANGUAGE_OPTIONS,
} from "@/lib/fhirPatientSchema";

const TABS = [
  { key: "identity", label: "Identity" },
  { key: "identifiers", label: "Identifiers" },
  { key: "contacts", label: "Contacts" },
  { key: "addresses", label: "Addresses" },
  { key: "relationships", label: "Relationships" },
  { key: "clinical", label: "Clinical" },
  { key: "women", label: "Women's Health" },
  { key: "insurance", label: "Insurance" },
  { key: "consents", label: "Consents" },
];

const defaultValues: PatientWizardValues = {
  identity: {
    given_names: [""], family_name: "", other_names: [], preferred_name: "",
    name_script: "Latn", sex_at_birth: "unknown", date_of_birth: "", gender: "Other",
    gender_identity: "", pronouns: "", marital_status: undefined,
    occupation: "", education_level: undefined, preferred_language: "en",
    country_of_origin: "KE", refugee_status: "citizen", photo_url: "",
  },
  identifiers: [],
  contacts: [],
  addresses: [],
  relationships: [],
  clinical: { blood_type: "", allergies: [], conditions: [], current_medications: "" },
  women_health: undefined,
  insurance: [],
  consents: consentTypeOptions.map(t => ({ consent_type: t, granted: false })),
};

// ============ Sub-components ============
function FieldRow({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function IdentityTab() {
  const { register, control, formState: { errors }, watch, setValue } = useFormContext<PatientWizardValues>();
  const givenNames = watch("identity.given_names");

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Given Names</Label>
        <div className="space-y-2 mt-1.5">
          {givenNames.map((_, i) => (
            <div key={i} className="flex gap-2">
              <Input {...register(`identity.given_names.${i}` as const)} placeholder={`Given name ${i + 1}`} />
              {givenNames.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue("identity.given_names", givenNames.filter((_, x) => x !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setValue("identity.given_names", [...givenNames, ""])}>
            <Plus className="h-3 w-3 mr-1" /> Add given name
          </Button>
        </div>
        {errors.identity?.given_names && <p className="text-xs text-destructive mt-1">{errors.identity.given_names.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Family Name *">
          <Input {...register("identity.family_name")} />
          {errors.identity?.family_name && <p className="text-xs text-destructive">{errors.identity.family_name.message}</p>}
        </FieldRow>
        <FieldRow label="Preferred Name">
          <Input {...register("identity.preferred_name")} />
        </FieldRow>
        <FieldRow label="Sex at Birth *">
          <Controller name="identity.sex_at_birth" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{sexAtBirthOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
        <FieldRow label="Date of Birth *">
          <Input type="date" {...register("identity.date_of_birth")} />
          {errors.identity?.date_of_birth && <p className="text-xs text-destructive">{errors.identity.date_of_birth.message}</p>}
        </FieldRow>
        <FieldRow label="Gender Identity">
          <Input {...register("identity.gender_identity")} placeholder="optional" />
        </FieldRow>
        <FieldRow label="Pronouns">
          <Input {...register("identity.pronouns")} placeholder="e.g. she/her" />
        </FieldRow>
        <FieldRow label="Marital Status">
          <Controller name="identity.marital_status" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{maritalStatusOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
        <FieldRow label="Education">
          <Controller name="identity.education_level" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{educationLevelOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
        <FieldRow label="Occupation">
          <Input {...register("identity.occupation")} />
        </FieldRow>
        <FieldRow label="Preferred Language">
          <Controller name="identity.preferred_language" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGE_OPTIONS.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
        <FieldRow label="Country of Origin">
          <Controller name="identity.country_of_origin" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRY_OPTIONS.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
        <FieldRow label="Refugee Status">
          <Controller name="identity.refugee_status" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{refugeeStatusOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </FieldRow>
      </div>
      <FieldRow label="Photo URL (optional)">
        <Input {...register("identity.photo_url")} placeholder="https://..." />
      </FieldRow>
    </div>
  );
}

function IdentifiersTab({ asInsurance = false }: { asInsurance?: boolean }) {
  const { control, register, watch, setValue } = useFormContext<PatientWizardValues>();
  const name = asInsurance ? "insurance" : "identifiers";
  const { fields, append, remove } = useFieldArray({ control, name: name as any });
  const items = watch(name as any) as any[];
  const typeFilter = asInsurance
    ? ["sha_number", "nhif_number", "private_insurance"] as const
    : identifierTypeOptions.filter(t => !["sha_number", "nhif_number", "private_insurance"].includes(t));

  const setPrimary = (idx: number) => {
    items.forEach((_, i) => setValue(`${name}.${i}.is_primary` as any, i === idx));
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No {asInsurance ? "insurance schemes" : "identifiers"} yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Controller name={`${name}.${i}.identifier_type` as any} control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>{typeFilter.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <Input placeholder="Value" {...register(`${name}.${i}.identifier_value` as any)} />
            <Input placeholder="Country code (KE)" {...register(`${name}.${i}.identifier_country` as any)} />
            <Input placeholder="Issuing authority" {...register(`${name}.${i}.issuing_authority` as any)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs">
              <input type="radio" name={`${name}-primary`} checked={!!items[i]?.is_primary} onChange={() => setPrimary(i)} />
              Primary
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ identifier_type: typeFilter[0], identifier_value: "", identifier_country: "KE", is_primary: fields.length === 0, issuing_authority: "" } as any)}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add {asInsurance ? "scheme" : "identifier"}
      </Button>
    </div>
  );
}

function ContactsTab() {
  const { control, register } = useFormContext<PatientWizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No contacts yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Controller name={`contacts.${i}.contact_type`} control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contactTypeOptions.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <Input placeholder="Value" {...register(`contacts.${i}.value`)} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {(["opt_in_sms", "opt_in_whatsapp", "opt_in_email", "is_primary"] as const).map(k => (
              <Controller key={k} name={`contacts.${i}.${k}` as any} control={control} render={({ field }) => (
                <label className="flex items-center gap-1.5">
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} /> {k.replace(/_/g, " ")}
                </label>
              )} />
            ))}
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ contact_type: "phone_personal", value: "", is_primary: fields.length === 0, opt_in_sms: false, opt_in_whatsapp: false, opt_in_email: false })}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add contact
      </Button>
    </div>
  );
}

function AddressesTab() {
  const { control, register, watch, setValue } = useFormContext<PatientWizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });
  const addresses = watch("addresses");

  const { data: countries = [] } = useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      const { data } = await supabase.from("geographic_areas").select("*").eq("level", "country").order("name");
      return data || [];
    },
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No addresses yet.</p>}
      {fields.map((f, i) => (
        <AddressRow key={f.id} i={i} register={register} control={control} countries={countries} remove={() => remove(i)} setValue={setValue} country={addresses[i]?.country} />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ address_type: "home", country: "KE", region: "", county: "", sub_county: "", ward: "", village: "", street: "", postal_code: "", is_current: true })}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add address
      </Button>
    </div>
  );
}

function AddressRow({ i, register, control, countries, remove, country }: any) {
  const { data: counties = [] } = useQuery({
    queryKey: ["geo", "counties", country],
    enabled: !!country,
    queryFn: async () => {
      const c = countries.find((x: any) => x.country_code === country);
      if (!c) return [];
      const { data } = await supabase.from("geographic_areas").select("*").eq("parent_id", c.id).order("name");
      return data || [];
    },
  });

  return (
    <div className="p-3 border border-border rounded-lg space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Controller name={`addresses.${i}.address_type`} control={control} render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{addressTypeOptions.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <Controller name={`addresses.${i}.country`} control={control} render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>{countries.map((c: any) => <SelectItem key={c.id} value={c.country_code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <Controller name={`addresses.${i}.county`} control={control} render={({ field }) => (
          counties.length > 0 ? (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="County/Region" /></SelectTrigger>
              <SelectContent>{counties.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : <Input placeholder="Region" {...register(`addresses.${i}.region`)} />
        )} />
        <Input placeholder="Sub-county" {...register(`addresses.${i}.sub_county`)} />
        <Input placeholder="Ward" {...register(`addresses.${i}.ward`)} />
        <Input placeholder="Village" {...register(`addresses.${i}.village`)} />
        <Input placeholder="Street" {...register(`addresses.${i}.street`)} />
        <Input placeholder="Postal code" {...register(`addresses.${i}.postal_code`)} />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={remove}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function RelationshipsTab() {
  const { control, register } = useFormContext<PatientWizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "relationships" });
  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No related persons yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" {...register(`relationships.${i}.related_person_name`)} />
            <Controller name={`relationships.${i}.relationship`} control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                <SelectContent>{relationshipOptions.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <Input placeholder="Phone" {...register(`relationships.${i}.phone`)} />
            <Input placeholder="Email" {...register(`relationships.${i}.email`)} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Controller name={`relationships.${i}.is_emergency_contact`} control={control} render={({ field }) => (
              <label className="flex items-center gap-1.5"><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /> Emergency contact</label>
            )} />
            <Controller name={`relationships.${i}.is_legal_decision_maker`} control={control} render={({ field }) => (
              <label className="flex items-center gap-1.5"><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /> Legal decision-maker</label>
            )} />
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ related_person_name: "", relationship: "next_of_kin", is_emergency_contact: false, is_legal_decision_maker: false, phone: "", email: "" })}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add relationship
      </Button>
    </div>
  );
}

function ClinicalTab() {
  const { control, register } = useFormContext<PatientWizardValues>();
  const a = useFieldArray({ control, name: "clinical.allergies" });
  const c = useFieldArray({ control, name: "clinical.conditions" });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Blood Type">
          <Input {...register("clinical.blood_type")} placeholder="e.g. O+" />
        </FieldRow>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground mb-2">Allergies</p>
        <div className="space-y-2">
          {a.fields.map((f, i) => (
            <div key={f.id} className="p-2 border border-border rounded-md grid grid-cols-3 gap-2">
              <Input placeholder="Substance" {...register(`clinical.allergies.${i}.substance`)} />
              <Input placeholder="Reaction" {...register(`clinical.allergies.${i}.reaction`)} />
              <div className="flex gap-2">
                <Controller name={`clinical.allergies.${i}.severity`} control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>{allergySeverityOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                <Button type="button" variant="ghost" size="sm" onClick={() => a.remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => a.append({ substance: "", reaction: "", severity: undefined, notes: "" })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add allergy
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground mb-2">Chronic Conditions</p>
        <div className="space-y-2">
          {c.fields.map((f, i) => (
            <div key={f.id} className="p-2 border border-border rounded-md grid grid-cols-3 gap-2">
              <Input placeholder="ICD-10 code" {...register(`clinical.conditions.${i}.icd_code`)} />
              <Input placeholder="Description" {...register(`clinical.conditions.${i}.icd_description`)} />
              <div className="flex gap-2">
                <Input type="date" {...register(`clinical.conditions.${i}.onset_date`)} />
                <Button type="button" variant="ghost" size="sm" onClick={() => c.remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => c.append({ icd_code: "UNCODED", icd_description: "", onset_date: "", notes: "" })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add condition
          </Button>
        </div>
      </div>

      <FieldRow label="Current Medications">
        <Textarea rows={3} {...register("clinical.current_medications")} placeholder="One per line" />
      </FieldRow>

      <div>
        <p className="text-xs font-medium text-foreground mb-2">Social History</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Smoking">
            <Controller name="clinical.social_history.smoking_status" control={control} render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{smokingStatusOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </FieldRow>
          <FieldRow label="Alcohol use">
            <Controller name="clinical.social_history.alcohol_use" control={control} render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{alcoholUseOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </FieldRow>
          <FieldRow label="Household size">
            <Input type="number" {...register("clinical.social_history.household_size")} />
          </FieldRow>
          <FieldRow label="Water source">
            <Input {...register("clinical.social_history.water_source")} />
          </FieldRow>
          <FieldRow label="Distance to facility (km)">
            <Input type="number" step="0.1" {...register("clinical.social_history.distance_to_facility_km")} />
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

function WomenHealthTab() {
  const { control, register } = useFormContext<PatientWizardValues>();
  return (
    <div className="grid grid-cols-2 gap-3">
      <FieldRow label="Last menstrual period">
        <Input type="date" {...register("women_health.last_menstrual_period")} />
      </FieldRow>
      <FieldRow label="Contraception method">
        <Input {...register("women_health.contraception_method")} />
      </FieldRow>
      <FieldRow label="Gravida">
        <Input type="number" {...register("women_health.gravida")} />
      </FieldRow>
      <FieldRow label="Parity">
        <Input type="number" {...register("women_health.parity")} />
      </FieldRow>
      <FieldRow label="Abortions">
        <Input type="number" {...register("women_health.abortions")} />
      </FieldRow>
      <FieldRow label="Gestational age (weeks)">
        <Input type="number" {...register("women_health.gestational_age_weeks")} />
      </FieldRow>
      <Controller name="women_health.is_pregnant" control={control} render={({ field }) => (
        <label className="flex items-center gap-2 text-sm pt-6"><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /> Currently pregnant</label>
      )} />
      <Controller name="women_health.is_breastfeeding" control={control} render={({ field }) => (
        <label className="flex items-center gap-2 text-sm pt-6"><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /> Currently breastfeeding</label>
      )} />
    </div>
  );
}

function ConsentsTab() {
  const { control, watch } = useFormContext<PatientWizardValues>();
  const consents = watch("consents");
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">Capture initial consents. Patients may revoke any of these later from the patient detail panel.</p>
      {consents.map((c, i) => (
        <div key={c.consent_type} className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div>
            <p className="text-sm font-medium capitalize">{c.consent_type.replace("_", " ")}</p>
            <p className="text-xs text-muted-foreground">
              {c.consent_type === "treatment" && "Consent to general clinical treatment"}
              {c.consent_type === "data_sharing" && "Share clinical data with referral facilities"}
              {c.consent_type === "ai_processing" && "Allow AI-assisted analysis of clinical data"}
              {c.consent_type === "photography" && "Use of clinical photography for records"}
            </p>
          </div>
          <Controller name={`consents.${i}.granted`} control={control} render={({ field }) => (
            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
          )} />
        </div>
      ))}
    </div>
  );
}

// ============ Mutation ============
function useRegisterPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: PatientWizardValues) => {
      const id = v.identity;
      const insertPayload: any = {
        first_name: id.given_names.join(" "),
        last_name: id.family_name,
        given_names: id.given_names.filter(Boolean),
        family_name: id.family_name,
        other_names: id.other_names,
        preferred_name: id.preferred_name || null,
        name_script: id.name_script,
        sex_at_birth: id.sex_at_birth,
        gender: id.gender_identity || (id.sex_at_birth === "male" ? "M" : id.sex_at_birth === "female" ? "F" : "Other"),
        date_of_birth: id.date_of_birth,
        gender_identity: id.gender_identity || null,
        pronouns: id.pronouns || null,
        marital_status: id.marital_status || null,
        occupation: id.occupation || null,
        education_level: id.education_level || null,
        preferred_language: id.preferred_language,
        country_of_origin: id.country_of_origin || null,
        refugee_status: id.refugee_status || null,
        photo_url: id.photo_url || null,
        blood_type: v.clinical.blood_type || null,
      };
      const { data: patient, error } = await supabase.from("patients").insert(insertPayload).select().single();
      if (error) throw error;
      const pid = patient.id;

      const rollback = async () => { try { await supabase.from("patients").delete().eq("id", pid); } catch {} };

      try {
        const ops: any[] = [];
        const allIdents = [...v.identifiers, ...v.insurance].filter(x => x.identifier_value);
        if (allIdents.length)
          ops.push(supabase.from("patient_identifiers").insert(allIdents.map(x => ({ ...x, patient_id: pid, identifier_country: x.identifier_country || null, issuing_authority: x.issuing_authority || null })) as any));
        if (v.contacts.length)
          ops.push(supabase.from("patient_contacts").insert(v.contacts.map(c => ({ ...c, patient_id: pid })) as any));
        if (v.addresses.length)
          ops.push(supabase.from("patient_addresses").insert(v.addresses.map(a => ({ ...a, patient_id: pid })) as any));
        if (v.relationships.length)
          ops.push(supabase.from("patient_relationships").insert(v.relationships.map(r => ({ ...r, patient_id: pid })) as any));
        if (v.clinical.allergies.length)
          ops.push(supabase.from("patient_allergies").insert(v.clinical.allergies.map(a => ({ ...a, patient_id: pid, substance_code_system: "other", status: "active" })) as any));
        if (v.clinical.conditions.length)
          ops.push(supabase.from("patient_conditions").insert(v.clinical.conditions.map(c => ({ ...c, patient_id: pid, icd_version: "ICD-10", status: "active", onset_date: c.onset_date || null })) as any));
        if (v.clinical.social_history && Object.values(v.clinical.social_history).some(x => x !== undefined && x !== ""))
          ops.push(supabase.from("patient_social_history").insert({ ...v.clinical.social_history, patient_id: pid } as any));
        if (v.women_health && Object.values(v.women_health).some(x => x !== undefined && x !== "" && x !== null))
          ops.push(supabase.from("patient_women_health").insert({ ...v.women_health, patient_id: pid, last_menstrual_period: v.women_health.last_menstrual_period || null } as any));
        const granted = v.consents.filter(c => c.granted);
        if (granted.length)
          ops.push(supabase.from("patient_consents").insert(granted.map(c => ({ patient_id: pid, hospital_id: patient.hospital_id, consent_type: c.consent_type, status: "granted" })) as any));

        const results = await Promise.all(ops);
        const firstErr = results.find((r: any) => r?.error);
        if (firstErr?.error) throw firstErr.error;
      } catch (e) {
        await rollback();
        throw e;
      }

      return patient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient_count"] });
    },
  });
}

// ============ Main wizard ============
export function PatientRegistrationWizard({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState("identity");
  const methods = useForm<PatientWizardValues>({
    resolver: zodResolver(patientWizardSchema) as any,
    defaultValues,
  });
  const register = useRegisterPatient();

  const sex = methods.watch("identity.sex_at_birth");
  const dob = methods.watch("identity.date_of_birth");
  const showWomen = useMemo(() => {
    if (sex !== "female" || !dob) return false;
    const ageYears = (Date.now() - new Date(dob).getTime()) / (365.25 * 86400000);
    return ageYears > 10;
  }, [sex, dob]);

  const visibleTabs = TABS.filter(t => t.key !== "women" || showWomen);

  const onSubmit = methods.handleSubmit(
    async (values) => {
      try {
        await register.mutateAsync(values);
        toast.success("Patient registered");
        onClose();
      } catch (e: any) {
        toast.error(e.message || "Registration failed");
      }
    },
    (errors) => {
      console.error("validation errors", errors);
      toast.error("Please fix the highlighted fields");
      // jump to first tab with errors
      if (errors.identity) setTab("identity");
      else if (errors.identifiers) setTab("identifiers");
      else if (errors.contacts) setTab("contacts");
      else if (errors.addresses) setTab("addresses");
      else if (errors.relationships) setTab("relationships");
      else if (errors.clinical) setTab("clinical");
    }
  );

  const tabIndex = visibleTabs.findIndex(t => t.key === tab);
  const goNext = () => setTab(visibleTabs[Math.min(tabIndex + 1, visibleTabs.length - 1)].key);
  const goPrev = () => setTab(visibleTabs[Math.max(tabIndex - 1, 0)].key);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold">Register New Patient</h3>
            <p className="text-xs text-muted-foreground">FHIR R4 demographics · pan-African</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mx-5 mt-4 flex-wrap h-auto justify-start">
                {visibleTabs.map((t, i) => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    <Badge variant="outline" className="mr-1.5 h-4 px-1 text-[10px]">{i + 1}</Badge>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <TabsContent value="identity"><IdentityTab /></TabsContent>
                <TabsContent value="identifiers"><IdentifiersTab /></TabsContent>
                <TabsContent value="contacts"><ContactsTab /></TabsContent>
                <TabsContent value="addresses"><AddressesTab /></TabsContent>
                <TabsContent value="relationships"><RelationshipsTab /></TabsContent>
                <TabsContent value="clinical"><ClinicalTab /></TabsContent>
                {showWomen && <TabsContent value="women"><WomenHealthTab /></TabsContent>}
                <TabsContent value="insurance"><IdentifiersTab asInsurance /></TabsContent>
                <TabsContent value="consents"><ConsentsTab /></TabsContent>
              </div>
            </Tabs>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
              <Button type="button" variant="outline" size="sm" onClick={goPrev} disabled={tabIndex === 0}>Previous</Button>
              <p className="text-xs text-muted-foreground">Step {tabIndex + 1} of {visibleTabs.length}</p>
              {tabIndex < visibleTabs.length - 1 ? (
                <Button type="button" size="sm" onClick={goNext}>Next</Button>
              ) : (
                <Button type="submit" size="sm" disabled={register.isPending}>
                  {register.isPending ? "Saving..." : "Register patient"}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
