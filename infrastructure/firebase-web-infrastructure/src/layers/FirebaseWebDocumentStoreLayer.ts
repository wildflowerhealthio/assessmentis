import { DocumentData, DocumentStore } from '@assessmentis/platform-domain'
import { Effect, Either, Layer, Stream } from 'effect'
import { FirebaseWeb } from '../tagClasses'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { unsubscribableCallbackAsStream } from '@assessmentis/util'

const resourceTypeFromPath = (path: ReadonlyArray<string>) =>
  path
    .slice(0, path.length - 1)
    .reduce(
      (acc, segment, i) => (i % 2 == 0 ? `${acc}/${segment}` : `${acc}/*`),
      ''
    )

const paramsFromPath = (path: ReadonlyArray<string>) =>
  path
    .slice(1)
    .reduce(
      (acc, segment, i) =>
        i % 2 == 0 ? acc : { ...acc, [path[i - 1]]: segment },
      {} as Record<string, string>
    )

export const FirebaseWebDocumentStoreLayer: Layer.Layer<
  DocumentStore,
  never,
  FirebaseWeb
> = Layer.effect(
  DocumentStore,
  Effect.gen(function* () {
    const { firestore } = yield* FirebaseWeb

    const get: typeof DocumentStore.Service.get = (...path) =>
      Effect.gen(function* () {
        const [collection, ...restPath] = path
        const docRef = doc(firestore, collection, ...restPath)

        const docSnapshot = yield* Effect.tryPromise({
          try: () => getDoc(docRef),
          catch: (cause) =>
            new UnhandledError({
              message: `Error reading ${resourceTypeFromPath(path)} document`,
              cause,
            }),
        })

        const data = docSnapshot.data()
        if (data == undefined) {
          return yield* Effect.fail(
            new NotFoundError({
              resourceType: resourceTypeFromPath(path),
              params: paramsFromPath(path),
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
          Either.Either<DocumentData, NotFoundError>,
          never
        >((onData) =>
          onSnapshot(docRef, (documentSnapshot) => {
            const data = documentSnapshot.data()
            if (data == undefined) {
              onData(
                Effect.succeed(
                  Either.left(
                    new NotFoundError({
                      resourceType: resourceTypeFromPath(path),
                      params: paramsFromPath(path),
                    })
                  )
                )
              )
            } else {
              onData(Effect.succeed(Either.right(data)))
            }
          })
        )
      }).pipe(Stream.unwrap)

    return { get, subscribeTo }
  })
)
