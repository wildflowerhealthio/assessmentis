import { Effect } from 'effect'
import {
  DocumentData,
  Firestore,
  doc,
  getDoc,
  setDoc,
  SetOptions,
} from 'firebase/firestore'
import { UnhandledError, NotFoundError } from '@assessmentis/ontology'

/**
 * Effect-based wrapper for Firestore getDoc operation
 * @param firestore Firestore instance
 * @param path Collection path (e.g., 'orgs')
 * @param docId Document ID
 * @returns Effect that yields the document data or fails with NotFoundError if not found
 */
export const getDocument = <T = DocumentData>(
  firestore: Firestore,
  path: string,
  docId: string
): Effect.Effect<T, NotFoundError | UnhandledError> =>
  Effect.tryPromise({
    try: async () => {
      const docRef = doc(firestore, path, docId)
      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        throw new NotFoundError({
          resourceType: 'document',
          params: { path, docId },
        })
      }
      return docSnapshot.data() as T
    },
    catch: (error) => {
      if (error instanceof NotFoundError) {
        return error
      }
      return new UnhandledError({
        cause: error,
        message: `Failed to get document: ${path}/${docId}`,
      })
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
): Effect.Effect<void, UnhandledError> =>
  Effect.tryPromise({
    try: async () => {
      const docRef = doc(firestore, path, docId)
      await setDoc(docRef, data, options ?? {})
    },
    catch: (error) => {
      return new UnhandledError({
        cause: error,
        message: `Failed to set document: ${path}/${docId}`,
      })
    },
  })
