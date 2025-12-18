import { expect, test, describe } from 'vitest'
import * as FirebaseWebInfrastructure from './index'
import { snapshotStream } from './firestore'
import { getDocument, setDocument, getDocumentRef } from './firestoreEffects'

describe('firebase-web-infrastructure exports', () => {
  test('exports createPlatformService', () => {
    expect(FirebaseWebInfrastructure.createPlatformService).toBeDefined()
    expect(typeof FirebaseWebInfrastructure.createPlatformService).toBe(
      'function'
    )
  })

  test('exports createRuntime', () => {
    expect(FirebaseWebInfrastructure.createRuntime).toBeDefined()
    expect(typeof FirebaseWebInfrastructure.createRuntime).toBe('function')
  })

  test('exports expected module structure', () => {
    const exports = Object.keys(FirebaseWebInfrastructure)
    expect(exports.length).toBeGreaterThan(0)
  })

  test('exports getDocument', () => {
    expect(FirebaseWebInfrastructure.getDocument).toBeDefined()
    expect(typeof FirebaseWebInfrastructure.getDocument).toBe('function')
  })

  test('exports setDocument', () => {
    expect(FirebaseWebInfrastructure.setDocument).toBeDefined()
    expect(typeof FirebaseWebInfrastructure.setDocument).toBe('function')
  })

  test('exports getDocumentRef', () => {
    expect(FirebaseWebInfrastructure.getDocumentRef).toBeDefined()
    expect(typeof FirebaseWebInfrastructure.getDocumentRef).toBe('function')
  })
})

describe('firestore utilities', () => {
  test('snapshotStream is a function', () => {
    expect(snapshotStream).toBeDefined()
    expect(typeof snapshotStream).toBe('function')
  })
})

describe('firestore effects utilities', () => {
  test('getDocument is a function', () => {
    expect(getDocument).toBeDefined()
    expect(typeof getDocument).toBe('function')
  })

  test('setDocument is a function', () => {
    expect(setDocument).toBeDefined()
    expect(typeof setDocument).toBe('function')
  })

  test('getDocumentRef is a function', () => {
    expect(getDocumentRef).toBeDefined()
    expect(typeof getDocumentRef).toBe('function')
  })
})
