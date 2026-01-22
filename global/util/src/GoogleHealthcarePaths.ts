/**
 * Configuration for Google Healthcare FHIR store
 */
export interface GoogleHealthcareConfig {
  projectId: string
  dataset: string
  region: string
  storeId: string
}

/**
 * Builds the parent path for a Google Healthcare FHIR store
 * @param config - The healthcare configuration
 * @returns The parent path string
 */
export const buildFhirStoreParent = (
  config: GoogleHealthcareConfig
): string => {
  return `projects/${config.projectId}/locations/${config.region}/datasets/${config.dataset}/fhirStores/${config.storeId}`
}

/**
 * Builds the full path for a FHIR resource
 * @param parent - The FHIR store parent path
 * @param resourceType - The FHIR resource type
 * @param id - The resource ID
 * @returns The full resource path
 */
export const buildFhirResourcePath = (
  parent: string,
  resourceType: string,
  id: string
): string => {
  return `${parent}/fhir/${resourceType}/${id}`
}

/**
 * Builds the base FHIR API path for a resource type
 * @param parent - The FHIR store parent path
 * @param resourceType - The FHIR resource type
 * @returns The base FHIR API path
 */
export const buildFhirTypePath = (
  parent: string,
  resourceType: string
): string => {
  return `${parent}/fhir/${resourceType}`
}
