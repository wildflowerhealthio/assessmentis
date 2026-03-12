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

/** Union of all registered clinical resource `domainType` string literals. */
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

/**
 * Maps each DomainType string to its Effect Schema class.
 *
 * @remarks
 * The `type` and `const` share a name via declaration merging. The type is
 * the lookup table shape; the const holds the actual Schema class references
 * keyed by their `DomainType` literal, used at runtime for schema dispatch.
 */
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

/**
 * Runtime registry mapping each `DomainType` string to its Effect Schema class.
 *
 * @remarks
 * This `const` intentionally shares its name with the `ResourceDataTypes` type
 * above via TypeScript declaration merging. The type provides a type-level
 * lookup table; the const provides the runtime registry. This is intentional,
 * not an accidental name collision.
 */
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
