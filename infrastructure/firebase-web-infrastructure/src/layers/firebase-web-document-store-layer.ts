import { Effect, Either, Layer, Stream, Predicate } from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { DocumentStore } from '@assessmentis/platform-domain'
import type { DocumentData, DocumentPath } from '@assessmentis/platform-domain'
import { isDevelopment, unsubscribableCallbackAsStream } from '@assessmentis/util'

import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'

import { FirebaseWeb } from '../tagClasses'

const resolvePath = (...args: string[] | [DocumentPath]): readonly string[] => {
  if (Predicate.isTupleOf(1)<string | DocumentPath>(args)) {
    return args[0]
  } else {
    return args
  }
}

const resourceTypeFromPath = (path: readonly string[]): string => {
  if (isDevelopment()) {
    return path.join('/')
  }
  return (
    path.slice(0, -1).reduce((acc, segment, i) => {
      if (i % 2 === 0) {
        return `${acc}/${segment}`
      }
      return `${acc}/*`
    }, '') + '/:id'
  )
}

export const FirebaseWebDocumentStoreLayer: Layer.Layer<DocumentStore, never, FirebaseWeb> =
  Layer.effect(
    DocumentStore,
    Effect.gen(function* FirebaseWebDocumentStoreLayer() {
      const { firestore, auth } = yield* FirebaseWeb

      const get: typeof DocumentStore.Service.get = (...args) =>
        Effect.gen(function* () {
          const path = resolvePath(...args)
          const [collection, ...restPath] = path
          const docRef = doc(firestore, collection, ...restPath)

          const docSnapshot = yield* Effect.tryPromise({
            catch: (cause) =>
              new UnhandledError({
                message: `Error calling getDoc for ${resourceTypeFromPath(path)} for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                cause,
              }),
            try: async () => getDoc(docRef),
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

      const subscribeTo: typeof DocumentStore.Service.subscribeTo = (...args) =>
        Effect.sync(() => {
          const path = resolvePath(...args)
          const [collection, ...restPath] = path
          const docRef = doc(firestore, collection, ...restPath)

          return unsubscribableCallbackAsStream<
            Either.Either<
              DocumentData,
              UnhandledError | NotFoundError<'Document', { path: readonly string[] }>
            >,
            never
          >((onData) => {
            try {
              return onSnapshot(
                docRef,
                (documentSnapshot) => {
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
                },
                (cause) => {
                  onData(
                    Effect.succeed(
                      Either.left(
                        new UnhandledError({
                          cause,
                          message: `Error getting ${resourceTypeFromPath(path)} document data for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                        })
                      )
                    )
                  )
                }
              )
            } catch (error) {
              onData(
                Effect.succeed(
                  Either.left(
                    new UnhandledError({
                      message: `Error calling onSnapshot for ${resourceTypeFromPath(path)} for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                      cause: error,
                    })
                  )
                )
              )
              return (): void => {}
            }
          })
        }).pipe(Stream.unwrap)

      const set: typeof DocumentStore.Service.set = (data, ...args) =>
        Effect.gen(function* () {
          const path = resolvePath(...args)
          const [collection, ...restPath] = path
          const docRef = doc(firestore, collection, ...restPath)

          yield* Effect.tryPromise({
            catch: (cause) =>
              new UnhandledError({
                message: `Error setting ${resourceTypeFromPath(path)} document for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                cause,
              }),
            try: async () => setDoc(docRef, data),
          })
        })

      const update: typeof DocumentStore.Service.update = (data, ...args) =>
        Effect.gen(function* () {
          const path = resolvePath(...args)
          const [collection, ...restPath] = path
          const docRef = doc(firestore, collection, ...restPath)

          yield* Effect.tryPromise({
            catch: (cause) =>
              new UnhandledError({
                message: `Error updating ${resourceTypeFromPath(path)} document for ${auth.currentUser?.displayName ?? 'unknown user'}`,
                cause,
              }),
            try: async () => setDoc(docRef, data, { merge: true }),
          })
        })

      return { get, set, subscribeTo, update }
    })
  )
