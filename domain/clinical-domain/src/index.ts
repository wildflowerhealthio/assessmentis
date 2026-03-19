/**
 * Core clinical domain package — resource schemas, data types,
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
export type {
  default as ResourceDataTypes,
  ResourceType,
  ClinicalDomainClasses,
} from './resource-data-types'
export { toSupportedClasses } from './resource-data-types'
export * from './types'
export { ClinicalDomainHub } from './clinical-domain-hub'
