import type { DocumentData } from '@assessmentis/platform-domain'
import { DocumentStore } from '@assessmentis/platform-domain'
import { Effect, Either, Layer, Stream } from 'effect'
import { FirebaseWeb } from '../tagClasses'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { unsubscribableCallbackAsStream } from '@assessmentis/util'

const resourceTypeFromPath = (path: ReadonlyArray<string>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env.DEV
    ? path.join('/')
    : path
        .slice(0, path.length - 1)
        .reduce(
          (acc, segment, i) => (i % 2 == 0 ? `${acc}/${segment}` : `${acc}/*`),
          ''
        ) + '/:id'

export const FirebaseWebDocumentStoreLayer: Layer.Layer<
  DocumentStore,
  never,
  FirebaseWeb
> = Layer.effect(
  DocumentStore,
  Effect.gen(function* () {
    const { firestore, auth } = yield* FirebaseWeb

    const get: typeof DocumentStore.Service.get = (...path) =>
      Effect.gen(function* () {
        const [collection, ...restPath] = path
        const docRef = doc(firestore, collection, ...restPath)

        const docSnapshot = yield* Effect.tryPromise({
          try: () => getDoc(docRef),
          catch: (cause) =>
            new UnhandledError({
              message: `Error calling getDoc for ${resourceTypeFromPath(path)} for ${auth.currentUser?.displayName ?? 'unknown user'}`,
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
      Effect.sync(() => {
        const [collection, ...restPath] = path
        const docRef = doc(firestore, collection, ...restPath)

        return unsubscribableCallbackAsStream<
          Either.Either<
            DocumentData,
            | UnhandledError
            | NotFoundError<'Document', { path: ReadonlyArray<string> }>
          >,
          never
        >((onData) => {
          try {
            return onSnapshot(
              docRef,
              (documentSnapshot) => {
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
              },
              (cause) => {
                onData(
                  Effect.succeed(
                    Either.left(
                      new UnhandledError({
                        message: `Error getting ${resourceTypeFromPath(path)} document data for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                        cause,
                      })
                    )
                  )
                )
              }
            )
          } catch (cause) {
            onData(
              Effect.succeed(
                Either.left(
                  new UnhandledError({
                    message: `Error calling onSnapshot for ${resourceTypeFromPath(path)} for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                    cause,
                  })
                )
              )
            )
            return () => {}
          }
        })
      }).pipe(Stream.unwrap)

    const set: typeof DocumentStore.Service.set = (data, ...path) =>
      Effect.gen(function* () {
        const [collection, ...restPath] = path
        const docRef = doc(firestore, collection, ...restPath)

        yield* Effect.tryPromise({
          try: () => setDoc(docRef, data),
          catch: (cause) =>
            new UnhandledError({
              message: `Error setting ${resourceTypeFromPath(path)} document for ${auth.currentUser?.displayName ?? 'unknown user'}`,
              cause,
            }),
        })
      })

    const update: typeof DocumentStore.Service.update = (data, ...path) =>
      Effect.gen(function* () {
        const [collection, ...restPath] = path
        const docRef = doc(firestore, collection, ...restPath)

        yield* Effect.tryPromise({
          try: () => setDoc(docRef, data, { merge: true }),
          catch: (cause) =>
            new UnhandledError({
              message: `Error updating ${resourceTypeFromPath(path)} document for ${auth.currentUser?.displayName ?? 'unknown user'}`,
              cause,
            }),
        })
      })

    return { get, subscribeTo, set, update }
  })
)
