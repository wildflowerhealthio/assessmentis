import { UnhandledError, NotFoundError } from '@assessmentis/ontology'
import { DocumentData, DocumentStore } from '@assessmentis/platform-domain'
import { Layer, Effect, Either } from 'effect'
import { FirebaseAdmin } from '../services'
import { Firestore } from 'firebase-admin/firestore'
import { unsubscribableCallbackAsStream } from '@assessmentis/util'

const doc = (db: Firestore, path: ReadonlyArray<string>) => {
  let doc = db.collection(path[0]).doc(path[1])
  for (let i = 2; i < path.length; i += 2) {
    doc = doc.collection(path[i]).doc(path[i + 1])
  }
  return doc
}

const resourceType = (path: ReadonlyArray<string>) =>
  path
    .slice(0, path.length - 1)
    .reduce(
      (acc, segment, i) => (i % 2 == 0 ? `${acc}/${segment}` : `${acc}/*`),
      ''
    )

export const FirebaseAdminDocumentStoreLayer = Layer.effect(
  DocumentStore,
  Effect.gen(function* () {
    const { firestore: db } = yield* FirebaseAdmin

    const get: typeof DocumentStore.Service.get = (...path) =>
      Effect.gen(function* () {
        const docSnapshot = yield* Effect.tryPromise({
          try: () => doc(db, path).get(),
          catch: (cause) =>
            new UnhandledError({
              message: `Error reading ${resourceType(path)} document`,
              cause,
            }),
        })

        const data = docSnapshot.data()
        if (data == undefined) {
          return yield* Effect.fail(
            new NotFoundError({
              resourceType: 'Document',
              params: { path },
            })
          )
        }
        return data
      })

    const subscribeTo: typeof DocumentStore.Service.subscribeTo = (...path) =>
      unsubscribableCallbackAsStream<
        Either.Either<
          DocumentData,
          NotFoundError<'Document', { path: ReadonlyArray<string> }>
        >,
        never
      >((onData) =>
        doc(db, path).onSnapshot((documentSnapshot) => {
          const data = documentSnapshot.data()
          if (data == undefined) {
            onData(
              Effect.succeed(
                Either.left(
                  new NotFoundError({
                    resourceType: 'Document',
                    params: { path },
                  })
                )
              )
            )
          } else {
            onData(Effect.succeed(Either.right(data)))
          }
        })
      )

    const set: typeof DocumentStore.Service.set = (data, ...path) =>
      Effect.tryPromise({
        try: () => doc(db, path).set(data),
        catch: (cause) =>
          new UnhandledError({
            message: `Error setting ${resourceType(path)} document`,
            cause,
          }),
      }).pipe(Effect.asVoid)

    const update: typeof DocumentStore.Service.update = (data, ...path) =>
      Effect.tryPromise({
        try: () => doc(db, path).set(data, { merge: true }),
        catch: (cause) =>
          new UnhandledError({
            message: `Error updating ${resourceType(path)} document`,
            cause,
          }),
      }).pipe(Effect.asVoid)

    return { get, subscribeTo, set, update }
  })
).pipe(Layer.provide(FirebaseAdmin.Default))
