/* oxlint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest'

/**
 * Mock Firestore DocumentSnapshot
 */
export const createMockDocumentSnapshot = (
  data?: Record<string, unknown>
): {
  data: ReturnType<typeof vi.fn>
  exists: boolean
} => ({
  data: vi.fn(() => data),
  exists: data !== undefined,
})

/**
 * Mock Firestore DocumentReference
 */
export const createMockDocumentReference = (): any => ({
  collection: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
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
  collection: vi.fn(() => createMockCollectionReference()),
  settings: vi.fn(),
})

/**
 * Mock Firebase Auth instance
 */
export const createMockAuth = (): Record<string, never> => ({})

/**
 * Mock Firebase App instance
 */
export const createMockApp = (): { name: string } => ({
  name: '[DEFAULT]',
})
