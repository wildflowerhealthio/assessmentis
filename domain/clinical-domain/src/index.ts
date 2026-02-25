// Resource namespaces
export * as Bundle from './resources/Bundle'
export * as Composition from './resources/Composition'
export * as DiagnosticReport from './resources/DiagnosticReport'
export * as Encounter from './resources/Encounter'
export * as Location from './resources/Location'
export * as Media from './resources/Media'
export * as Observation from './resources/Observation'
export * as Patient from './resources/Patient'
export * as Practitioner from './resources/Practitioner'
export * as Questionnaire from './resources/Questionnaire'
export * as QuestionnaireResponse from './resources/QuestionnaireResponse'

// Registry types
export { default as Schemas } from './Schemas'
export { default as Repositories, type RepositoriesType } from './Repositories'
export type {
  default as ResourceDataTypes,
  ResourceType,
} from './ResourceDataTypes'
export type { default as FhirResourceDataTypes } from './FhirResourceDataTypes'
export * from './types'
