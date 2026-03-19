import { Schema } from 'effect'

import { Location, Patient, Practitioner, Questionnaire } from '@assessmentis/clinical-domain'

// Form schema for Encounter create/edit
// Note: This is simpler than CreateEncounterArg which includes video call setup
export const EncounterFormSchema = Schema.Struct({
  patientUrl: Schema.optional(Patient.UrlSchema),
  practitionerUrls: Schema.optional(Schema.Array(Practitioner.UrlSchema)),
  // Required
  questionnaireUrls: Schema.Array(Questionnaire.UrlSchema),
  periodStart: Schema.optional(Schema.DateTimeZonedFromSelf),
  periodEnd: Schema.optional(Schema.DateTimeZonedFromSelf),
  locationUrl: Schema.optional(Location.UrlSchema),
})

export type EncounterFormData = typeof EncounterFormSchema.Type
