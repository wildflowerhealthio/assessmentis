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
  | typeof Composition.DomainType
  | typeof DiagnosticReport.DomainType
  | typeof Encounter.DomainType
  | typeof Location.DomainType
  | typeof Media.DomainType
  | typeof Observation.DomainType
  | typeof Patient.DomainType
  | typeof Practitioner.DomainType
  | typeof Questionnaire.DomainType
  | typeof QuestionnaireResponse.DomainType

type ResourceDataTypes = {
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
  [Composition.DomainType]: Composition,
  [DiagnosticReport.DomainType]: DiagnosticReport,
  [Encounter.DomainType]: Encounter,
  [Location.DomainType]: Location,
  [Media.DomainType]: Media,
  [Observation.DomainType]: Observation,
  [Patient.DomainType]: Patient,
  [Practitioner.DomainType]: Practitioner,
  [Questionnaire.DomainType]: Questionnaire,
  [QuestionnaireResponse.DomainType]: QuestionnaireResponse,
} as const

export default ResourceDataTypes
