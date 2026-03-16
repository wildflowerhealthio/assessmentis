import { Chunk, Effect, Option, Stream } from 'effect'
import type { StreamEmit } from 'effect'

import { onSnapshot } from 'firebase/firestore'
import type {
  DocumentData,
  DocumentReference,
  FirestoreError,
} from 'firebase/firestore'

export const snapshotStream = (
  documentRef: DocumentReference<DocumentData, DocumentData>
): Stream.Stream<DocumentData, FirestoreError | string> =>
  Stream.async(
    (
      emit: StreamEmit.Emit<never, FirestoreError | string, DocumentData, void>
    ) => {
      console.log(
        'Setting up Firestore snapshot listener on document:',
        documentRef.path
      )
      const unsubscribe = onSnapshot(
        documentRef,
        (documentSnapshot) => {
          const data = documentSnapshot.data()
          if (data == undefined) {
            emit(Effect.fail(Option.some(`could not find ${documentRef.path}`)))
          } else {
            console.log('Found Firestore document snapshot:', data)
            emit(Effect.succeed(Chunk.of(Option.some(data))))
          }
        },
        (err) => {
          console.error('Error receiving Firestore document snapshot:', err)
          emit(Effect.fail(Option.some(err)))
        },
        () => emit(Effect.fail(Option.none()))
      )
      return Effect.sync(() => {
        console.log(
          'Unsubscribing from Firestore snapshot listener on document:',
          documentRef.path
        )
        unsubscribe()
      })
    },
    { bufferSize: 1, strategy: 'dropping' }
  )
