import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { Composition } from './resources/Composition'
import { DiagnosticReport } from './resources/DiagnosticReport'
import { Encounter } from './resources/Encounter'
import { Location } from './resources/Location'
import { Media } from './resources/Media'
import { Observation } from './resources/Observation'
import { Patient } from './resources/Patient'
import { Practitioner } from './resources/Practitioner'
import { Questionnaire } from './resources/Questionnaire'
import { QuestionnaireResponse } from './resources/QuestionnaireResponse'

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

interface ResourceDataTypes {
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

const ResourceDataTypes = {
  [Composition.Key]: Composition,
  [DiagnosticReport.Key]: DiagnosticReport,
  [Encounter.Key]: Encounter,
  [Location.Key]: Location,
  [Media.Key]: Media,
  [Observation.Key]: Observation,
  [Patient.Key]: Patient,
  [Practitioner.Key]: Practitioner,
  [Questionnaire.Key]: Questionnaire,
  [QuestionnaireResponse.Key]: QuestionnaireResponse,
} as const

export default ResourceDataTypes
