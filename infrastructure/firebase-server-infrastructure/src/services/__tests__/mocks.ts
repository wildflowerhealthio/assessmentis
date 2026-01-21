/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest'

/**
 * Mock Firestore DocumentSnapshot
 */
export const createMockDocumentSnapshot = (data?: Record<string, unknown>) => ({
  data: vi.fn(() => data),
  exists: data !== undefined,
})

/**
 * Mock Firestore DocumentReference
 */
export const createMockDocumentReference = (): any => ({
  get: vi.fn(),
  set: vi.fn(),
  collection: vi.fn(),
})

/**
 * Mock Firestore CollectionReference
 */
export const createMockCollectionReference = (): any => ({
  doc: vi.fn(() => createMockDocumentReference()),
})

/**
 * Mock Firestore instance
 */
export const createMockFirestore = (): any => ({
  settings: vi.fn(),
  collection: vi.fn(() => createMockCollectionReference()),
})

/**
 * Mock Firebase Auth instance
 */
export const createMockAuth = () => ({})

/**
 * Mock Firebase App instance
 */
export const createMockApp = () => ({
  name: '[DEFAULT]',
})
