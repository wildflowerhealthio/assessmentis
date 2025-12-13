import { Context, Effect, Layer, Schema, Option } from 'effect'
import {
  Bundle,
  type Element,
  hasId,
  WithId,
  assertId,
} from '@assessmentis/clinical-domain/general-purpose'
import {
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/clinical-domain/errors'
import { BaseConfig } from '@assessmentis/config-domain/googleFhir'
import { UnknownException } from 'effect/Cause'

const TransactionResponseBundle = Bundle(
  Schema.Struct({
    request: Schema.Struct({
      etag: Schema.String,
      lastModified: Schema.String,
      location: Schema.String,
      status: Schema.String,
    }),
  })
)

export class BaseGoogleFhirStoreClient extends Context.Tag(
  'BaseGoogleFhirStoreClient'
)<
  BaseGoogleFhirStoreClient,
  {
    parent: string
    getAll: <A extends Element, I>(
      resource: string,
      schema: Schema.Schema<A, I, never>
    ) => (
      _args: unknown
    ) => Effect.Effect<
      WithId<A>[],
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    getById: <Id extends string, A extends Element<Id>, I>(
      resource: string,
      schema: Schema.Schema<A, I, never>
    ) => (
      id: Id
    ) => Effect.Effect<
      WithId<A>,
      | UnhandledError
      | NeedsAuthenticationError
      | NotFoundError
      | ExternalAssertionError,
      never
    >

    deleteById: <Id extends string, A extends Element<Id>, I>(
      resource: string,
      schema: Schema.Schema<A, I, never>
    ) => (
      id: Id
    ) => Effect.Effect<
      object,
      | UnhandledError
      | NeedsAuthenticationError
      | NotFoundError
      | ExternalAssertionError,
      never
    >

    create: <A extends Element, I extends object>(
      dataType: string,
      schema: Schema.Schema<A, I, never>
    ) => (
      data: A
    ) => Effect.Effect<
      WithId<A>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    createMany: <
      A extends Element,
      I extends { resourceType: string; id?: string | undefined },
    >(
      schema: Schema.Schema<A, I, never>
    ) => (
      encodedResources: ReadonlyArray<A>
    ) => Effect.Effect<
      ReadonlyArray<WithId<A>>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    update: <A extends Element, I extends object>(
      dataType: string,
      schema: Schema.Schema<A, I, never>
    ) => (
      data: WithId<A>
    ) => Effect.Effect<
      WithId<A>,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >
  }
>() {}

const gapiPoll = (): Effect.Effect<void, NeedsAuthenticationError, never> =>
  Effect.gen(function* () {
    let polls = 0
    while (
      window?.gapi?.client?.healthcare?.projects?.locations?.datasets
        ?.fhirStores?.fhir == undefined ||
      window?.gapi?.client?.getToken().access_token == undefined
    ) {
      console.log('Polling for gapi healthcare client availability...')
      yield* Effect.sleep('100 millis')
      polls += 1
      if (polls > 20) {
        return yield* Effect.fail(
          new NeedsAuthenticationError({
            cause:
              'Polled for two seconds and never found gapi?.client?.healthcare?.projects?.locations?.datasets?.fhirStores?.fhir',
          })
        )
      }
    }
    return
  })

const getStatus = (resp: unknown) =>
  Schema.decodeUnknownOption(Schema.Struct({ status: Schema.Number }))(
    resp
  ).pipe(Option.getOrElse(() => ({ status: undefined }))).status

export const LiveClient = (config: BaseConfig) => {
  return Layer.effect(
    BaseGoogleFhirStoreClient,
    Effect.sync(function () {
      console.log('Building LiveFhirClient')

      const cloudRegion = config.region
      const projectId = config.projectId
      const datasetId = config.dataset
      const fhirStoreId = config.storeId
      const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/fhirStores/${fhirStoreId}`

      const getAll: typeof BaseGoogleFhirStoreClient.Service.getAll = <
        A extends Element,
        I,
      >(
        resourceType: string,
        schema: Schema.Schema<A, I, never>
      ) => {
        const DataBundle = Bundle(schema)
        const decodeBundle = Schema.decodeUnknown<
          typeof DataBundle.Type,
          typeof DataBundle.Encoded,
          never
        >(DataBundle)

        return (
          _args: unknown
        ): Effect.Effect<
          WithId<A>[],
          UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
          never
        > =>
          Effect.gen(function* () {
            yield* gapiPoll()

            const response = yield* Effect.tryPromise(() =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.search(
                {
                  parent,
                  resource: { resourceType } as gapi.client.healthcare.HttpBody,
                }
              )
            ).pipe(handleFhirApiErrors<never>())

            const { entry } = yield* decodeBundle(response.result).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    cause,
                    expected: 'Search response could not be decoded',
                  })
              )
            )

            if (entry == undefined) {
              return []
            } else {
              return entry
                .map((q): (A & { id: string }) | undefined => {
                  const res = q.resource
                  if (res != undefined && hasId(res)) {
                    return res
                  }
                  return undefined
                })
                .filter((q) => q != undefined)
            }
          })
      }

      const getById: typeof BaseGoogleFhirStoreClient.Service.getById = <
        Id extends string,
        A extends Element<Id>,
        I,
      >(
        resource: string,
        schema: Schema.Schema<A, I, never>
      ) => {
        const decode = Schema.decodeUnknown<
          typeof schema.Type,
          typeof schema.Encoded,
          never
        >(schema)

        return (
          id: Id
        ): Effect.Effect<
          WithId<A>,
          | UnhandledError
          | NeedsAuthenticationError
          | NotFoundError
          | ExternalAssertionError,
          never
        > =>
          Effect.gen(function* () {
            yield* gapiPoll()

            const response = yield* Effect.tryPromise(() =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.read(
                {
                  name: `${parent}/fhir/${resource}/${id}`,
                }
              )
            ).pipe(
              Effect.mapError((err) => {
                const status = getStatus(err.cause)

                if (status == 404 || status == 410) {
                  return new NotFoundError({
                    resourceType: resource,
                    params: { id },
                    cause: err,
                  })
                }
                return err
              }),
              handleFhirApiErrors()
            )

            const gotten = yield* decode(response.result).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected: 'Expected resource to conform to schema',
                    cause,
                  })
              )
            )

            const resourceWithId: WithId<A> = yield* assertId(gotten).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected: 'Resource to have id',
                    cause,
                  })
              )
            )

            return resourceWithId
          })
      }

      const update: typeof BaseGoogleFhirStoreClient.Service.update = <
        Id extends string,
        A extends Element<Id>,
        I,
      >(
        resource: string,
        schema: Schema.Schema<A, I, never>
      ) => {
        const encode = Schema.encode<
          typeof schema.Type,
          typeof schema.Encoded,
          never
        >(schema)

        const decode = Schema.decodeUnknown<
          typeof schema.Type,
          typeof schema.Encoded,
          never
        >(schema)

        return (
          data: WithId<A>
        ): Effect.Effect<
          WithId<A>,
          | UnhandledError
          | NeedsAuthenticationError
          | NotFoundError
          | ExternalAssertionError,
          never
        > =>
          Effect.gen(function* () {
            yield* gapiPoll()

            const resourceData = yield* encode(data).pipe(
              Effect.mapError((cause) => new UnhandledError({ cause }))
            )

            const response = yield* Effect.tryPromise(() =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.update(
                {
                  name: `${parent}/fhir/${resource}/${data.id}`,
                  resource: resourceData as gapi.client.healthcare.HttpBody,
                }
              )
            ).pipe(
              Effect.mapError((err) => {
                const status = getStatus(err.cause)

                if (status == 404 || status == 410) {
                  return new NotFoundError({
                    resourceType: resource,
                    params: { id: data.id },
                    cause: err,
                  })
                }
                return err
              }),
              handleFhirApiErrors()
            )

            const gotten = yield* decode(response.result).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected: 'Expected resource to conform to schema',
                    cause,
                  })
              )
            )

            const resourceWithId: WithId<A> = yield* assertId(gotten).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected: 'Resource to have id',
                    cause,
                  })
              )
            )

            return resourceWithId
          })
      }

      const deleteById: typeof BaseGoogleFhirStoreClient.Service.deleteById = <
        Id extends string,
        A extends Element<Id>,
        I,
      >(
        resource: string,
        _: Schema.Schema<A, I, never>
      ) => {
        return (
          id: Id
        ): Effect.Effect<
          object,
          | UnhandledError
          | NeedsAuthenticationError
          | NotFoundError
          | ExternalAssertionError,
          never
        > =>
          Effect.gen(function* () {
            yield* gapiPoll()

            const response = yield* Effect.tryPromise(() =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.delete(
                {
                  name: `${parent}/fhir/${resource}/${id}`,
                }
              )
            ).pipe(
              Effect.mapError((err) => {
                const status = getStatus(err.cause)

                if (status == 404 || status == 410) {
                  return new NotFoundError({
                    resourceType: resource,
                    params: { id },
                    cause: err,
                  })
                }
                return err
              }),
              handleFhirApiErrors()
            )

            console.log('Delete response:', response)

            return {}
          })
      }

      const create: typeof BaseGoogleFhirStoreClient.Service.create = <
        A extends Element,
        I extends object,
      >(
        dataType: string,
        schema: Schema.Schema<A, I, never>
      ) => {
        const encode = Schema.encode<
          typeof schema.Type,
          typeof schema.Encoded,
          never
        >(schema)
        const decode = Schema.decodeUnknown(schema)
        return (
          data: A
        ): Effect.Effect<
          WithId<A>,
          UnhandledError | ExternalAssertionError | NeedsAuthenticationError,
          never
        > =>
          encode(data).pipe(
            Effect.mapError((cause) => new UnhandledError({ cause })),
            Effect.flatMap((resource) =>
              gapiPoll().pipe(Effect.map(() => resource))
            ),
            Effect.flatMap((resource: I) =>
              Effect.tryPromise(() =>
                gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.create(
                  {
                    parent,
                    type: dataType,
                    resource,
                  }
                )
              ).pipe(handleFhirApiErrors<never>())
            ),
            Effect.flatMap((response) =>
              decode(response.result).pipe(
                Effect.mapError(
                  (cause) =>
                    new ExternalAssertionError({
                      expected: 'Created resource to conform to schema',
                      cause,
                    })
                )
              )
            ),
            Effect.flatMap((resource: A) =>
              assertId(resource).pipe(
                Effect.mapError(
                  (cause: unknown): ExternalAssertionError =>
                    new ExternalAssertionError({
                      expected: 'Created resource to have id',
                      cause,
                    })
                )
              )
            )
          )
      }

      const createMany: typeof BaseGoogleFhirStoreClient.Service.createMany =
        <
          A extends Element,
          I extends { resourceType: string; id?: string | undefined },
        >(
          schema: Schema.Schema<A, I, never>
        ) =>
        (resources: ReadonlyArray<A>) =>
          Effect.gen(function* () {
            const resourceArraySchema = Schema.Array(schema)
            const encodedResources = yield* Schema.encode(resourceArraySchema)(
              resources
            ).pipe(Effect.mapError((cause) => new UnhandledError({ cause })))
            const resource = {
              resourceType: 'Bundle',
              type: 'transaction',
              entry: encodedResources.map((resource) => ({
                resource,
                request: {
                  method: 'POST',
                  url: resource.resourceType,
                } as const,
              })),
            }
            yield* gapiPoll()
            const response = yield* Effect.tryPromise(() =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle(
                {
                  parent,
                  resource: resource as gapi.client.healthcare.HttpBody,
                }
              )
            ).pipe(handleFhirApiErrors<never>())

            const responseBundle = yield* Schema.decodeUnknown(
              TransactionResponseBundle
            )(response.result).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected:
                      'Response should be an transaction response bundle',
                    cause,
                  })
              )
            )

            if (responseBundle.entry == undefined) {
              return yield* Effect.fail(
                new ExternalAssertionError({
                  cause: undefined,
                  expected:
                    'Expected transaction response bundle to have entries',
                })
              )
            }

            const ids = yield* Effect.all(
              responseBundle.entry.map((entry) => {
                if (typeof entry?.response?.location != 'string') {
                  return Effect.fail(
                    new ExternalAssertionError({
                      expected:
                        'Expected entry in transaction response bundle to have a location URL',
                      cause: undefined,
                    })
                  )
                }
                const locationParts = entry.response.location.split('/')
                if (locationParts.length < 15) {
                  return Effect.fail(
                    new ExternalAssertionError({
                      cause: undefined,
                      expected:
                        'Expected entry in transaction response bundle to have a location URL shaped like `https://healthcare.googleapis.com/v1/projects/PROJECT_ID/locations/REGION/datasets/REGION/fhirStores/FHIR_STORE_ID/fhir/Patient/PATIENT_ID/_history/HISTORY_ID`',
                    })
                  )
                }

                return Effect.succeed(locationParts[14])
              })
            )

            const updated = yield* Schema.decode(resourceArraySchema)(
              encodedResources.map((resource, idx) => ({
                ...resource,
                id: ids[idx],
              }))
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    expected: 'Response should be an array of resources',
                    cause,
                  })
              )
            )
            return updated as WithId<A>[]
          })

      return {
        parent,
        getById,
        getAll,
        create,
        createMany,
        deleteById,
        update,
      }
    })
  )
}
const handleFhirApiErrors: <OtherErrors>() => (
  _: Effect.Effect<
    gapi.client.Response<gapi.client.healthcare.HttpBody>,
    OtherErrors | UnknownException,
    never
  >
) => Effect.Effect<
  gapi.client.Response<gapi.client.healthcare.HttpBody>,
  OtherErrors | NeedsAuthenticationError | UnhandledError,
  never
> = <OtherErrors>() =>
  Effect.mapError((err: OtherErrors | UnknownException) => {
    if (!(err instanceof UnknownException)) return err

    if (getStatus(err.cause) == 401) {
      return new NeedsAuthenticationError({ cause: err })
    }
    return new UnhandledError({ cause: err })
  })
