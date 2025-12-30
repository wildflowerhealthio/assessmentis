import { describe, it, expect } from 'vitest'
import { createResourceCollectionHook } from './createResourceCollectionHook'
import {
  PatientId,
  Patient,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'

describe('createResourceCollectionHook', () => {
  it('should create a hook function', () => {
    const useTestCollection = createResourceCollectionHook<
      PatientRepository,
      PatientId,
      Patient,
      typeof PatientRepository
    >({
      repository: PatientRepository,
    })

    expect(useTestCollection).toBeDefined()
    expect(typeof useTestCollection).toBe('function')
  })

  it('should return a function that accepts filters parameter', () => {
    const useTestCollection = createResourceCollectionHook<
      PatientRepository,
      PatientId,
      Patient,
      typeof PatientRepository
    >({
      repository: PatientRepository,
    })

    // The hook should be a function
    expect(typeof useTestCollection).toBe('function')

    // The hook signature should accept a filters object
    // We're testing the type signature rather than execution
    // since executing React hooks outside of a React component context
    // is complex and requires extensive mocking
    expect(useTestCollection.length).toBe(1) // Expects 1 parameter (filters)
  })
})
