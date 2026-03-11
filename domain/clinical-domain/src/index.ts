/**
 * Core clinical domain package — FHIR R4 resource schemas, data types,
 * repository interfaces, and the {@link ClinicalDomainHub} service tag.
 *
 * @packageDocumentation
 */

// Resources
export * from './resources/Bundle'
export * from './resources/Composition'
export * from './resources/DiagnosticReport'
export * from './resources/Encounter'
export * from './resources/Location'
export * from './resources/Media'
export * from './resources/Observation'
export * from './resources/Patient'
export * from './resources/Practitioner'
export * from './resources/Questionnaire'
export * from './resources/QuestionnaireResponse'

// Registry types
export { default as Schemas } from './Schemas'
export type {
  default as ResourceDataTypes,
  ResourceType,
} from './ResourceDataTypes'
export type { default as FhirResourceDataTypes } from './FhirResourceDataTypes'
export * from './types'
export { ClinicalDomainHub as ClinicalDomainHub } from './ClinicalDomainHub'
