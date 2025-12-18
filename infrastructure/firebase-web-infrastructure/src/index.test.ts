import { expect, test, describe } from 'vitest'
import * as FirebaseWebInfrastructure from './index'
import { snapshotStream } from './firestore'

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
})

describe('firestore utilities', () => {
  test('snapshotStream is a function', () => {
    expect(snapshotStream).toBeDefined()
    expect(typeof snapshotStream).toBe('function')
  })
})
