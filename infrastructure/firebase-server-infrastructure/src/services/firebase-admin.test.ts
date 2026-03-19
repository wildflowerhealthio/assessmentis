import { Effect, Exit } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getApp, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

import { FirebaseAdmin } from './firebase-admin'

// Mock firebase-admin modules before imports
vi.mock('firebase-admin/app', () => ({
  getApp: vi.fn(),
  initializeApp: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}))

const mockGetApp = vi.mocked(getApp)
const mockInitializeApp = vi.mocked(initializeApp)
const mockGetAuth = vi.mocked(getAuth)
const mockGetFirestore = vi.mocked(getFirestore)

describe('FirebaseAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set defaults
    const mockAuth = {}
    const mockFirestore = {
      settings: vi.fn(),
    }
    mockGetAuth.mockReturnValue(mockAuth as never)
    mockGetFirestore.mockReturnValue(mockFirestore as never)
  })

  it('creates singleton app instance when app does not exist', async () => {
    // Simulate app not existing
    const mockApp = { name: '[DEFAULT]' }
    mockGetApp.mockImplementationOnce(() => {
      throw new Error('No app')
    })
    mockInitializeApp.mockReturnValueOnce(mockApp as never)

    const program = Effect.gen(function* program() {
      const service = yield* FirebaseAdmin
      return service
    }).pipe(Effect.provide(FirebaseAdmin.Default))

    const result = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(result)).toBe(true)
    expect(mockGetApp).toHaveBeenCalledOnce()
    expect(mockInitializeApp).toHaveBeenCalledOnce()
    expect(mockInitializeApp).toHaveBeenCalledWith({
      projectId: 'assessmentis',
      storageBucket: 'assessmentis.firebasestorage.app',
    })
  })

  it('returns existing app instance when app exists', async () => {
    const mockApp = { name: '[DEFAULT]' }
    mockGetApp.mockReturnValueOnce(mockApp as never)

    const program = Effect.gen(function* program() {
      const service = yield* FirebaseAdmin
      return service
    }).pipe(Effect.provide(FirebaseAdmin.Default))

    const result = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(result)).toBe(true)
    expect(mockGetApp).toHaveBeenCalledOnce()
    expect(mockInitializeApp).not.toHaveBeenCalled()
  })

  it('returns auth and firestore instances', async () => {
    const mockApp = { name: '[DEFAULT]' }
    const mockAuth = {}
    const mockFirestore = {
      settings: vi.fn(),
    }
    mockGetApp.mockReturnValueOnce(mockApp as never)
    mockGetAuth.mockReturnValueOnce(mockAuth as never)
    mockGetFirestore.mockReturnValueOnce(mockFirestore as never)

    const program = Effect.gen(function* program() {
      const service = yield* FirebaseAdmin
      return service
    }).pipe(Effect.provide(FirebaseAdmin.Default))

    const result = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(result)).toBe(true)
    if (Exit.isSuccess(result)) {
      expect(result.value.app).toBe(mockApp)
      expect(result.value.auth).toBe(mockAuth)
      expect(result.value.firestore).toBe(mockFirestore)
      expect(mockGetAuth).toHaveBeenCalledWith(mockApp)
      expect(mockGetFirestore).toHaveBeenCalledWith(mockApp, 'assessmentis')
      expect(mockFirestore.settings).toHaveBeenCalledWith({
        ignoreUndefinedProperties: true,
      })
    }
  })
})
