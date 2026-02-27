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
