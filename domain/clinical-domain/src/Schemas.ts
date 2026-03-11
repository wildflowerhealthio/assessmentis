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

/**
 * Registry of all clinical resource Effect Schema classes, keyed by FHIR
 * `resourceType` literal. Used by infrastructure layers for schema-driven
 * decode/encode dispatch.
 */
const Schemas = {
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
