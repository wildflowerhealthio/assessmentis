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
  projectId: Schema.String,
  region: Schema.String,
  dataset: Schema.String,
  storeId: Schema.String,
  activeResources: Schema.Record({
    key: GoogleFhirResourceType,
    value: Schema.Literal(true),
  }),
})
export type GoogleFhirOriginDefinition = typeof GoogleFhirOriginDefinition.Type
