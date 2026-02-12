import { Schema } from 'effect'

// Form schema for Encounter create/edit
// Note: This is simpler than CreateEncounterArg which includes video call setup
export const EncounterFormSchema = Schema.Struct({
  patientId: Schema.optional(Schema.String),
  practitionerIds: Schema.optional(Schema.Array(Schema.String)),
  questionnaireIds: Schema.Array(Schema.String), // Required
  periodStart: Schema.optional(Schema.DateTimeZonedFromSelf),
  periodEnd: Schema.optional(Schema.DateTimeZonedFromSelf),
  locationId: Schema.optional(Schema.String),
})

export type EncounterFormData = typeof EncounterFormSchema.Type
