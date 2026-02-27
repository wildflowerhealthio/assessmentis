import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Composition } from './resources/Composition'
import type { DiagnosticReport } from './resources/DiagnosticReport'
import type { Encounter } from './resources/Encounter'
import type { Location } from './resources/Location'
import type { Media } from './resources/Media'
import type { Observation } from './resources/Observation'
import type { Patient } from './resources/Patient'
import type { Practitioner } from './resources/Practitioner'
import type { Questionnaire } from './resources/Questionnaire'
import type { QuestionnaireResponse } from './resources/QuestionnaireResponse'

export type ResourceType =
  | typeof Composition.Key
  | typeof DiagnosticReport.Key
  | typeof Encounter.Key
  | typeof Location.Key
  | typeof Media.Key
  | typeof Observation.Key
  | typeof Patient.Key
  | typeof Practitioner.Key
  | typeof Questionnaire.Key
  | typeof QuestionnaireResponse.Key

export default interface ResourceDataTypes {
  [key: string]: { domainType: string; url?: ReadonlyUrl }
  Composition: Composition
  DiagnosticReport: DiagnosticReport
  Encounter: Encounter
  Location: Location
  Media: Media
  Observation: Observation
  Patient: Patient
  Practitioner: Practitioner
  Questionnaire: Questionnaire
  QuestionnaireResponse: QuestionnaireResponse
}
