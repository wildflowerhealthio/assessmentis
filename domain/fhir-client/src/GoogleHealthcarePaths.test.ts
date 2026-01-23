import { describe, it, expect } from 'vitest'
import {
  buildFhirStoreParent,
  buildFhirResourcePath,
  buildFhirTypePath,
  GoogleHealthcareConfig,
} from './GoogleHealthcarePaths'

describe('GoogleHealthcarePaths', () => {
  const config: GoogleHealthcareConfig = {
    projectId: 'test-project',
    dataset: 'test-dataset',
    region: 'us-central1',
    storeId: 'test-store',
  }

  describe('buildFhirStoreParent', () => {
    it('should build correct parent path', () => {
      const result = buildFhirStoreParent(config)

      expect(result).toBe(
        'projects/test-project/locations/us-central1/datasets/test-dataset/fhirStores/test-store'
      )
    })
  })

  describe('buildFhirResourcePath', () => {
    it('should build correct resource path', () => {
      const parent = buildFhirStoreParent(config)
      const result = buildFhirResourcePath(parent, 'Patient', 'patient-123')

      expect(result).toBe(
        'projects/test-project/locations/us-central1/datasets/test-dataset/fhirStores/test-store/fhir/Patient/patient-123'
      )
    })
  })

  describe('buildFhirTypePath', () => {
    it('should build correct type path', () => {
      const parent = buildFhirStoreParent(config)
      const result = buildFhirTypePath(parent, 'Observation')

      expect(result).toBe(
        'projects/test-project/locations/us-central1/datasets/test-dataset/fhirStores/test-store/fhir/Observation'
      )
    })
  })
})
