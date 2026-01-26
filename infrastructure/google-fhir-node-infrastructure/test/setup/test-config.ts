import 'dotenv/config'

export const testConfig = {
  _tag: 'google_fhir_store' as const,
  apiKey: null,
  projectId: process.env.FHIR_PROJECT_ID || 'assessmentis',
  region: process.env.FHIR_REGION || 'northamerica-northeast2',
  dataset: process.env.FHIR_DATASET || 'integration-test',
  storeId: process.env.FHIR_STORE || 'integration-store-1',
}

export const GOOGLE_HEALTHCARE_BASE = 'https://healthcare.googleapis.com'

export const buildApiPath = (resourceType?: string, id?: string) => {
  const { projectId, region, dataset, storeId } = testConfig
  let path = `/v1/projects/${projectId}/locations/${region}/datasets/${dataset}/fhirStores/${storeId}/fhir`
  if (resourceType) {
    path += `/${resourceType}`
    if (id) {
      path += `/${id}`
    }
  }
  return path
}
