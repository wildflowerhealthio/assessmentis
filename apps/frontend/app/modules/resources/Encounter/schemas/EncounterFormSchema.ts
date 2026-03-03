import {
  Practitioner,
  Location,
  Questionnaire,
  Patient,
} from '@assessmentis/clinical-domain'
import { Schema } from 'effect'

// Form schema for Encounter create/edit
// Note: This is simpler than CreateEncounterArg which includes video call setup
export const EncounterFormSchema = Schema.Struct({
  patientUrl: Schema.optional(Patient.UrlSchema),
  practitionerUrls: Schema.optional(Schema.Array(Practitioner.UrlSchema)),
  questionnaireUrls: Schema.Array(Questionnaire.UrlSchema), // Required
  periodStart: Schema.optional(Schema.DateTimeZonedFromSelf),
  periodEnd: Schema.optional(Schema.DateTimeZonedFromSelf),
  locationUrl: Schema.optional(Location.UrlSchema),
})

export type EncounterFormData = typeof EncounterFormSchema.Type
