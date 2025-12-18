import { Effect } from 'effect'
import {
  DocumentData,
  DocumentReference,
  Firestore,
  doc,
  getDoc,
  setDoc,
  SetOptions,
} from 'firebase/firestore'

/**
 * Effect-based wrapper for Firestore getDoc operation
 * @param firestore Firestore instance
 * @param path Collection path (e.g., 'orgs')
 * @param docId Document ID
 * @returns Effect that yields the document data or null if not found
 */
export const getDocument = <T = DocumentData>(
  firestore: Firestore,
  path: string,
  docId: string
): Effect.Effect<T | null, Error> =>
  Effect.tryPromise({
    try: async () => {
      const docRef = doc(firestore, path, docId)
      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        return null
      }
      return docSnapshot.data() as T
    },
    catch: (error) => {
      if (error instanceof Error) {
        return error
      }
      return new Error(`Failed to get document: ${String(error)}`)
    },
  })

/**
 * Effect-based wrapper for Firestore setDoc operation
 * @param firestore Firestore instance
 * @param path Collection path (e.g., 'orgs')
 * @param docId Document ID
 * @param data Data to set
 * @param options Optional SetOptions for merge behavior
 * @returns Effect that completes when the document is set
 */
export const setDocument = (
  firestore: Firestore,
  path: string,
  docId: string,
  data: DocumentData,
  options?: SetOptions
): Effect.Effect<void, Error> =>
  Effect.tryPromise({
    try: async () => {
      const docRef = doc(firestore, path, docId)
      await setDoc(docRef, data, options ?? {})
    },
    catch: (error) => {
      if (error instanceof Error) {
        return error
      }
      return new Error(`Failed to set document: ${String(error)}`)
    },
  })

/**
 * Get a document reference for use with other Firestore operations
 * @param firestore Firestore instance
 * @param path Collection path (e.g., 'orgs')
 * @param docId Document ID
 * @returns DocumentReference
 */
export const getDocumentRef = (
  firestore: Firestore,
  path: string,
  docId: string
): DocumentReference<DocumentData, DocumentData> => doc(firestore, path, docId)
