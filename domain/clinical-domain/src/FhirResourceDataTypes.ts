import type fhir4 from 'fhir/r4'
import type ResourceDataTypes from './ResourceDataTypes'
// import type {
//   CompositionFromFhirR4,
//   QuestionnaireFromFhirR4,
//   QuestionnaireResponseFromFhirR4,
// } from './content-management'
// import type {
//   EncounterFromFhirR4,
//   LocationFromFhirR4,
//   PatientFromFhirR4,
//   PractitionerFromFhirR4,
// } from './administration'
// import type {
//   MediaFromFhirR4,
//   ObservationFromFhirR4,
// } from './diagnostic-medicine'

type ResourceTypeToResource = {
  [K in keyof ResourceDataTypes]: object
}
export default interface FhirResourceDataTypes extends ResourceTypeToResource {
  Composition: fhir4.Composition
  Encounter: fhir4.Encounter
  Location: fhir4.Location
  Media: fhir4.Media
  Observation: fhir4.Observation
  Patient: fhir4.Patient
  Practitioner: fhir4.Practitioner
  Questionnaire: fhir4.Questionnaire
  QuestionnaireResponse: fhir4.QuestionnaireResponse
}
