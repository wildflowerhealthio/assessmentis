import { Effect, Either, Layer } from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { DocumentStore } from '@assessmentis/platform-domain'
import type { DocumentData, DocumentPath } from '@assessmentis/platform-domain'
import { unsubscribableCallbackAsStream } from '@assessmentis/util'

import type { DocumentReference, Firestore } from 'firebase-admin/firestore'

import { FirebaseAdmin } from '../services'

const doc = (db: Firestore, path: DocumentPath): DocumentReference => {
  let currentDoc = db.collection(path[0]).doc(path[1])
  for (let i = 2; i + 1 < path.length; i += 2) {
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const subCollection = path[i]!
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const docId = path[i + 1]!
    currentDoc = currentDoc.collection(subCollection).doc(docId)
  }
  return currentDoc
}

const resourceType = (path: DocumentPath): string =>
  path.slice(0, -1).reduce((acc, segment, i) => {
    if (i % 2 === 0) {
      return `${acc}/${segment}`
    }
    return `${acc}/*`
  }, '')

export const FirebaseAdminDocumentStoreLayer = Layer.effect(
  DocumentStore,
  Effect.gen(function* FirebaseAdminDocumentStoreLayer() {
    const { firestore: db } = yield* FirebaseAdmin

    const get: typeof DocumentStore.Service.get = (path) =>
      Effect.gen(function* () {
        const docSnapshot = yield* Effect.tryPromise({
          catch: (cause) =>
            new UnhandledError({
              message: `Error reading ${resourceType(path)} document`,
              cause,
            }),
          try: async () => doc(db, path).get(),
        })

        const data = docSnapshot.data()
        if (data === undefined) {
          return yield* Effect.fail(
            new NotFoundError({
              params: { path },
              resourceType: 'Document',
            })
          )
        }
        return data
      })

    const subscribeTo: typeof DocumentStore.Service.subscribeTo = (path) => {
      return unsubscribableCallbackAsStream<
        Either.Either<DocumentData, NotFoundError<'Document', { path: readonly string[] }>>,
        never
      >((onData) =>
        doc(db, path).onSnapshot((documentSnapshot) => {
          const data = documentSnapshot.data()
          if (data === undefined) {
            onData(
              Effect.succeed(
                Either.left(
                  new NotFoundError({
                    params: { path },
                    resourceType: 'Document',
                  })
                )
              )
            )
          } else {
            onData(Effect.succeed(Either.right(data)))
          }
        })
      )
    }

    const set: typeof DocumentStore.Service.set = (data, path) => {
      return Effect.tryPromise({
        catch: (cause) =>
          new UnhandledError({
            message: `Error setting ${resourceType(path)} document`,
            cause,
          }),
        try: async () => doc(db, path).set(data),
      }).pipe(Effect.asVoid)
    }

    const update: typeof DocumentStore.Service.update = (data, path) => {
      return Effect.tryPromise({
        catch: (cause) =>
          new UnhandledError({
            message: `Error updating ${resourceType(path)} document`,
            cause,
          }),
        try: async () => doc(db, path).set(data, { merge: true }),
      }).pipe(Effect.asVoid)
    }

    return { get, set, subscribeTo, update }
  })
)
