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
export const createMockDocumentReference = () => {
  const mockDoc = {
    get: vi.fn(),
    set: vi.fn(),
    collection: vi.fn(() => mockCollection),
  }
  return mockDoc
}

/**
 * Mock Firestore CollectionReference
 */
export const createMockCollectionReference = () => {
  const mockCollection = {
    doc: vi.fn(() => createMockDocumentReference()),
  }
  return mockCollection
}

/**
 * Mock Firestore instance
 */
export const createMockFirestore = () => ({
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
