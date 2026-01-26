import { Effect } from 'effect'
import {
  DocumentData,
  Firestore,
  doc,
  setDoc,
  SetOptions,
} from 'firebase/firestore'
import { UnhandledError } from '@assessmentis/ontology'

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
