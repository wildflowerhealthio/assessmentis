import type { Schema } from 'effect'
import {
  Composition,
  DiagnosticReport,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '.'
import type ResourceDataTypes from './ResourceDataTypes'

const Schemas = {
  [Composition.Composition.Key]: Composition.Composition,
  [DiagnosticReport.DiagnosticReport.Key]: DiagnosticReport.DiagnosticReport,
  [Encounter.Encounter.Key]: Encounter.Encounter,
  [Location.Location.Key]: Location.Location,
  [Media.Media.Key]: Media.Media,
  [Observation.Observation.Key]: Observation.Observation,
  [Patient.Patient.Key]: Patient.Patient,
  [Practitioner.Practitioner.Key]: Practitioner.Practitioner,
  [Questionnaire.Questionnaire.Key]: Questionnaire.Questionnaire,
  [QuestionnaireResponse.QuestionnaireResponse.Key]:
    QuestionnaireResponse.QuestionnaireResponse,
} as const

// A small inline validation
const _SchemaTest: {
  [K in keyof typeof Schemas &
    keyof ResourceDataTypes]: ResourceDataTypes[K] extends Schema.Schema.Type<
    (typeof Schemas)[K]
  >
    ? (typeof Schemas)[K]
    : never
} = Schemas

export default Schemas
