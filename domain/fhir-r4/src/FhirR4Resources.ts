import type FhirR4 from 'fhir/r4'

export type Keys =
  | 'Composition'
  | 'DiagnosticReport'
  | 'Encounter'
  | 'Location'
  | 'Media'
  | 'Observation'
  | 'Patient'
  | 'Practitioner'
  | 'Questionnaire'
  | 'QuestionnaireResponse'

type AbstractEncodedTypes = {
  [K in Keys]: object
}

export interface EncodedTypes extends AbstractEncodedTypes {
  Composition: FhirR4.Composition
  DiagnosticReport: FhirR4.DiagnosticReport
  Encounter: FhirR4.Encounter
  Location: FhirR4.Location
  Media: FhirR4.Media
  Observation: FhirR4.Observation
  Patient: FhirR4.Patient
  Practitioner: FhirR4.Practitioner
  Questionnaire: FhirR4.Questionnaire
  QuestionnaireResponse: FhirR4.QuestionnaireResponse
}
