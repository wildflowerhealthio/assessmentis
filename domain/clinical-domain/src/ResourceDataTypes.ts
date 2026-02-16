import type {
  Encounter,
  Location,
  Patient,
  Practitioner,
} from './administration'
import type {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from './content-management'
import type { Media, Observation } from './diagnostic-medicine'

export type ResourceType =
  | 'Composition'
  | 'Encounter'
  | 'Location'
  | 'Media'
  | 'Observation'
  | 'Patient'
  | 'Practitioner'
  | 'Questionnaire'
  | 'QuestionnaireResponse'

export type ResourceDataTypeToResourceBase = {
  [K in ResourceType]: {
    resourceType: K
    id?: string | undefined
  }
}

export default interface ResourceDataTypes extends ResourceDataTypeToResourceBase {
  Composition: Composition
  Encounter: Encounter
  Location: Location
  Media: Media
  Observation: Observation
  Patient: Patient
  Practitioner: Practitioner
  Questionnaire: Questionnaire
  QuestionnaireResponse: QuestionnaireResponse
}
