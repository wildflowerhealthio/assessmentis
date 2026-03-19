import { Schema } from 'effect'

const GoogleFhirResourceType = Schema.Literal(
  'Composition',
  'DiagnosticReport',
  'Encounter',
  'Location',
  'Media',
  'Observation',
  'Patient',
  'Practitioner',
  'Questionnaire',
  'QuestionnaireResponse'
)

export const GoogleFhirOriginDefinition = Schema.TaggedStruct('google_fhir', {
  activeResources: Schema.Record({
    key: GoogleFhirResourceType,
    value: Schema.Literal(true),
  }),
  dataset: Schema.String,
  projectId: Schema.String,
  region: Schema.String,
  storeId: Schema.String,
})
export type GoogleFhirOriginDefinition = typeof GoogleFhirOriginDefinition.Type
