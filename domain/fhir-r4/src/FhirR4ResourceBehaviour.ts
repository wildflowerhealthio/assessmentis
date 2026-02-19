/*
 * This file uses `any` type casts in several places to work around TypeScript's
 * limitations when dealing with generic request/resolver types. These casts are
 * safe because:
 * 1. The actual types are enforced by the public API signatures
 * 2. The runtime behavior is validated by the Effect-TS Request/RequestResolver system
 * 3. Each resolver is strongly typed based on the Key parameter
 */

import { Resource as EffectResource } from 'effect'
import {
  Array,
  Record,
  Effect,
  Request,
  RequestResolver,
  Schema,
  Context,
} from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import {
  Resource,
  type WithId,
  type ResourceRequest,
  type SourceBehaviour,
  type BaseResource,
} from '@assessmentis/effectful-store'
import { assertId } from '@assessmentis/effectful-store'
import type { AuthError } from '@assessmentis/ontology'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { StreamEither } from '@assessmentis/util'
import { refineOrFail } from '@assessmentis/util'
import { FhirR4Bundle } from './foundation-framework'
import {
  Encounter,
  Patient,
} from '@assessmentis/clinical-domain/administration'
import { FhirR4Encounter, FhirR4Patient } from './administration'
import { symbol } from 'effect/Equivalence'

/**
 * Helper to decode and assert resource has ID
 */
const decodeAndAssertId = <T extends BaseResource, TEncoded>(
  schema: Schema.Schema<T, TEncoded, never>
) => {
  const decode = Schema.decodeUnknown(schema)

  return (
    result: unknown
  ): Effect.Effect<WithId<T>, ExternalAssertionError, never> =>
    Effect.gen(function* () {
      const decoded = yield* decode(result).pipe(
        Effect.mapError(
          (cause) =>
            new ExternalAssertionError({
              expected: 'Expected resource to conform to schema',
              cause,
            })
        )
      )

      const resourceWithId: WithId<T> = yield* assertId(
        decoded,
        new ExternalAssertionError({
          expected: 'Expected resource to have id',
          cause: decoded,
        })
      )

      return resourceWithId
    })
}

/**
 * Helper to decode a Bundle of resources
 */
const makeBundleDecoder = <T extends BaseResource, TEncoded>(
  schema: Schema.Schema<T, TEncoded, never>
) => {
  const DataBundle = FhirR4Bundle.Schema(schema)
  const rawDecodeBundle = Schema.decodeUnknown(DataBundle)

  return (rawBundle: unknown) =>
    rawDecodeBundle(rawBundle).pipe(
      Effect.mapError(
        (cause) =>
          new ExternalAssertionError({
            cause,
            expected: 'Search response could not be decoded as a Bundle',
          })
      ),
      Effect.map(({ entry }) => entry?.map((e) => e.resource) ?? []),
      Effect.flatMap(
        (
          entries
        ): Effect.Effect<readonly WithId<T>[], ExternalAssertionError, never> =>
          Effect.all(
            entries.map(
              refineOrFail<ExternalAssertionError, undefined | T, WithId<T>>(
                (entry: T | undefined): entry is WithId<T> =>
                  entry?.id !== undefined,
                (_) =>
                  new ExternalAssertionError({
                    expected:
                      'Expected resource entry to have a resource with an id',
                    cause: undefined,
                  })
              )
            )
          )
      )
    )
}

type BaseResources = {
  readonly [key: symbol]: BaseResource & Resource.AnyResource
}
interface Resources {
  readonly [Patient[Resource.ResourceType]]: Patient
  readonly [Encounter[Resource.ResourceType]]: Encounter
}

const fhirR4HttpProtocol = 'fhir-r4+http:'
const fhirR4HttpsProtocol = 'fhir-r4+https:'

export type FhirR4Protocol =
  | typeof fhirR4HttpProtocol
  | typeof fhirR4HttpsProtocol
interface FhirResource extends Resource.Resource<
  keyof Resources,
  Resource.ReadonlyUrl<{
    Protocol: FhirR4Protocol
  }>
> {
  resourceType: string
  id?: string | undefined
}

const fhirSchemas: {
  readonly [K in keyof Resources]: Schema.Schema<Resources[K], any, never>
} = {
  [Patient[Resource.ResourceType]]: FhirR4Patient.Schema,
  [Encounter[Resource.ResourceType]]: FhirR4Encounter.Schema,
} as const

const resolverForResource = <K extends keyof Resources>(request: {
  resourceType: K
}): AllActionResolver<Resources[K]> =>
  makeResolverSet({
    resourceType: request.resourceType,
    Schema: fhirSchemas[request.resourceType],
  })

export const FhirR4SourceBehaviour = ({
  clientStream,
  sourceId,
  sourceType,
  url,
  provokeReauth,
}: {
  clientStream: StreamEither.StreamEither<
    typeof FhirR4Client.Service,
    AuthError | UnhandledError
  >
  sourceType: string
  sourceId: string
  url: string
  provokeReauth: () => Effect.Effect<void, AuthError, never>
}): SourceBehaviour.SourceBehaviour<
  Resources,
  keyof Resources,
  FhirR4Client
> => {
  const resolverStream = clientStream.pipe(
    StreamEither.map((client) => {
      const resolver: ResourceRequest.MultiResolver<
        Resources,
        keyof Resources,
        FhirR4Client
      > = RequestResolver.fromEffect((request) => {
        const innerResolver = resolverForResource(request)

        return Effect.request(
          request,
          innerResolver.pipe(
            RequestResolver.provideContext(Context.make(FhirR4Client, client))
          )
        )
      })

      return resolver
    })
  )

  return {
    sourceId,
    sourceType,
    url,
    resolverStream,
    provokeReauth,
    activeResources: {
      Patient: true,
      Encounter: true,
    },
  }
}

export interface FhirR4ResourceBehaviour<
  T extends FhirResource,
  TEncoded = unknown,
> {
  resourceType: T['resourceType']
  Schema: Schema.Schema<T, TEncoded, never>
}

type AllActionResolver<T extends FhirResource> =
  RequestResolver.RequestResolver<
    | ResourceRequest.Get<T>
    | ResourceRequest.Search<T>
    | ResourceRequest.Create<T>
    | ResourceRequest.Update<T>
    | ResourceRequest.Delete<T>,
    FhirR4Client
  >

const makeResolverSet = <T extends FhirResource>({
  resourceType,
  Schema: schema,
}: {
  resourceType: T[Resource.ResourceType]
  Schema: Schema.Schema<T, any, never>
}): AllActionResolver<T> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)
  const bundleDecoder = makeBundleDecoder(schema)

  const Get = RequestResolver.makeBatched(
    (requests: ReadonlyArray<ResourceRequest.Get<T>>) =>
      Effect.gen(function* () {
        const client = yield* FhirR4Client
        // Group by resourceType (though they should all be the same)
        const byType = Array.groupBy(requests, (r) => r.resourceType)

        for (const [resType, reqs] of Record.toEntries(byType)) {
          if (reqs.length === 1) {
            // Single read → client.read()
            yield* client
              .read({
                resourceType: resType,
                id: reqs[0].id,
              })
              .pipe(
                Effect.matchEffect({
                  onFailure: (error) => Request.fail(reqs[0], error),
                  onSuccess: (raw) =>
                    decoder(raw).pipe(
                      Effect.matchEffect({
                        onFailure: (error) => Request.fail(reqs[0], error),
                        onSuccess: (decoded) =>
                          Request.succeed(reqs[0], decoded),
                      })
                    ),
                })
              )
          } else {
            // Batch → client.search({ _id: [id1, id2, ...] })
            const ids = reqs.map((r) => r.id)
            yield* client
              .search({
                resourceType: resType,
                id: ids,
              })
              .pipe(
                Effect.flatMap(bundleDecoder),
                Effect.matchEffect({
                  onFailure: (error) =>
                    Effect.all(reqs.map((req) => Request.fail(req, error))),
                  onSuccess: (entries) =>
                    Effect.gen(function* () {
                      // Match results back to requests by id
                      for (const req of reqs) {
                        const match = entries.find((e) => e.id === req.id)
                        if (match) {
                          yield* Request.succeed(req, match)
                        } else {
                          yield* Request.fail(
                            req,
                            new NotFoundError({
                              resourceType: resourceType,
                              params: { id: req.id },
                            })
                          )
                        }
                      }
                    }),
                })
              )
          }
        }
      })
  )

  const Search = RequestResolver.fromEffect(
    (request: ResourceRequest.Search<T>) =>
      Effect.flatMap(FhirR4Client, (client) =>
        client
          .search({ resourceType: request.resourceType, ...request.params })
          .pipe(Effect.flatMap(bundleDecoder))
      )
  )

  const Create = RequestResolver.fromEffect(
    (request: ResourceRequest.Create<T>) =>
      Effect.flatMap(FhirR4Client, (client) =>
        encode(request.resource).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({
                message: 'Error encoding resource',
                cause,
              })
          ),

          Effect.flatMap((resource) =>
            client.create({
              type: request.resourceType,
              resource,
            })
          ),
          Effect.flatMap(decoder)
        )
      )
  )

  const Update = RequestResolver.fromEffect(
    (request: ResourceRequest.Update<T>) => {
      const originalId = request.resource.id
      return Effect.flatMap(FhirR4Client, (client) =>
        encode(request.resource).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({ message: 'Error encoding resource', cause })
          ),
          Effect.flatMap((resource) =>
            client.update({
              id: originalId,
              type: resourceType,
              resource,
            })
          ),
          Effect.flatMap(decoder)
        )
      )
    }
  )

  const Delete = RequestResolver.fromEffect(
    (request: ResourceRequest.Delete<T>) =>
      Effect.flatMap(FhirR4Client, (client) =>
        client
          .delete<T['resourceType']>({
            type: request.resourceType,
            id: request.id,
          })
          .pipe(
            Effect.catchTag('NotFoundError', () =>
              Effect.fail(
                new NotFoundError<
                  T[Resource.ResourceType],
                  { url: Resource.InferResourceUrl<T> }
                >({
                  resourceType: request.resourceType,
                  params: { url: request.url },
                })
              )
            ),
            Effect.as(null)
          )
      )
  )

  return RequestResolver.fromEffect((request) => {
    switch (request._tag) {
      case 'Get':
        return Effect.request(
          request,
          Get.pipe(RequestResolver.contextFromServices(FhirR4Client))
        )
      case 'Search':
        return Effect.request(
          request,
          Search.pipe(RequestResolver.contextFromServices(FhirR4Client))
        )
      case 'Create':
        return Effect.request(
          request,
          Create.pipe(RequestResolver.contextFromServices(FhirR4Client))
        )
      case 'Update':
        return Effect.request(
          request,
          Update.pipe(RequestResolver.contextFromServices(FhirR4Client))
        )
      case 'Delete':
        return Effect.request(
          request,
          Delete.pipe(RequestResolver.contextFromServices(FhirR4Client))
        )
    }
  })
}
