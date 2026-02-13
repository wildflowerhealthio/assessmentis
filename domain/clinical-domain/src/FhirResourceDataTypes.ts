import type fhir4 from 'fhir/r4'
import type ResourceDataTypes from './ResourceDataTypes'

type ResourceTypeToResource = {
  [K in keyof ResourceDataTypes]: fhir4.Resource
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
