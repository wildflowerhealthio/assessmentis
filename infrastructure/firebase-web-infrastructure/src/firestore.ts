import { Chunk, Effect, Option, Stream } from 'effect'
import type { StreamEmit } from 'effect'

import { onSnapshot } from 'firebase/firestore'
import type { DocumentData, DocumentReference, FirestoreError } from 'firebase/firestore'

export const snapshotStream = (
  documentRef: DocumentReference<DocumentData>
): Stream.Stream<DocumentData, FirestoreError | string> =>
  Stream.async(
    (emit: StreamEmit.Emit<never, FirestoreError | string, DocumentData, void>) => {
      const unsubscribe = onSnapshot(
        documentRef,
        (documentSnapshot) => {
          const data = documentSnapshot.data()
          if (data === undefined) {
            void emit(Effect.fail(Option.some(`could not find ${documentRef.path}`)))
          } else {
            void emit(
              // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some is not an array method
              Effect.succeed(Chunk.of(Option.some(data)))
            )
          }
        },
        (err) => {
          void emit(
            Effect.andThen(
              Effect.logError('Error receiving Firestore document snapshot:', err),
              // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some is not an array method
              Effect.fail(Option.some(err))
            )
          )
        },
        () => {
          void emit(Effect.fail(Option.none()))
        }
      )
      return Effect.andThen(
        Effect.logInfo(
          'Unsubscribing from Firestore snapshot listener on document:',
          documentRef.path
        ),
        Effect.sync(() => unsubscribe())
      )
    },
    { bufferSize: 1, strategy: 'dropping' }
  )
