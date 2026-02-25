import type * as Composition from './resources/Composition'
import type * as DiagnosticReport from './resources/DiagnosticReport'
import type * as Encounter from './resources/Encounter'
import type * as Location from './resources/Location'
import type * as Media from './resources/Media'
import type * as Observation from './resources/Observation'
import type * as Patient from './resources/Patient'
import type * as Practitioner from './resources/Practitioner'
import type * as Questionnaire from './resources/Questionnaire'
import type * as QuestionnaireResponse from './resources/QuestionnaireResponse'

export type ResourceType =
  | typeof Composition.Composition.Key
  | typeof DiagnosticReport.DiagnosticReport.Key
  | typeof Encounter.Encounter.Key
  | typeof Location.Location.Key
  | typeof Media.Media.Key
  | typeof Observation.Observation.Key
  | typeof Patient.Patient.Key
  | typeof Practitioner.Practitioner.Key
  | typeof Questionnaire.Questionnaire.Key
  | typeof QuestionnaireResponse.QuestionnaireResponse.Key

export default interface ResourceDataTypes {
  [key: string]: { resourceType: string; id?: string; domainType: string }
  Composition: Composition.Composition
  DiagnosticReport: DiagnosticReport.DiagnosticReport
  Encounter: Encounter.Encounter
  Location: Location.Location
  Media: Media.Media
  Observation: Observation.Observation
  Patient: Patient.Patient
  Practitioner: Practitioner.Practitioner
  Questionnaire: Questionnaire.Questionnaire
  QuestionnaireResponse: QuestionnaireResponse.QuestionnaireResponse
}
