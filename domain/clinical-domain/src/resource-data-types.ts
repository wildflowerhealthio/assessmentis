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

/**
 * Runtime registry mapping each `DomainType` string to its Effect Schema class.
 *
 * @remarks
 * The `const` and `type` share a name via TypeScript declaration merging.
 * The const holds the actual Schema class references keyed by their
 * `DomainType` literal. The type is derived from the const via `typeof`,
 * so `ResourceDataTypes['Patient']` is `typeof Patient` (the class constructor).
 * Use `InstanceType<ResourceDataTypes['Patient']>` to get the instance type.
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

type ResourceDataTypes = typeof ResourceDataTypes

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

/** Union of all clinical domain class constructors. */
export type ClinicalDomainClasses = ResourceDataTypes[keyof ResourceDataTypes]

/**
 * Converts a boolean-keyed `supportedResources` map (as stored in
 * `BaseOriginDefinition`) into a class-constructor-keyed map suitable
 * for `Origin.supportedResources`.
 *
 * Keys not found in the clinical resource registry are silently dropped.
 */
export const toSupportedClasses = <Supported extends ResourceDataTypes[keyof ResourceDataTypes]>(
  supportedResources: Record<Supported['DomainType'], true>
): {
  readonly [Klass in Supported as Klass['DomainType']]: Klass
} =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  Object.fromEntries(
    Object.keys(supportedResources)
      .filter((k): k is keyof ResourceDataTypes => k in ResourceDataTypes)
      .map((k) => [k, ResourceDataTypes[k]])
  ) as {
    readonly [Klass in Supported as Klass['DomainType']]: Klass
  }

export default ResourceDataTypes
