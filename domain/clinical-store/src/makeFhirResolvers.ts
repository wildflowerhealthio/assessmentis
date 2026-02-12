import { Effect, Request, RequestResolver, Schema } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  Element,
  WithId,
  hasId,
  assertId,
} from '@assessmentis/clinical-domain/data-types'
import { Bundle } from '@assessmentis/clinical-domain/foundation-framework'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { refineOrFail } from '@assessmentis/util'
import { groupBy } from '@assessmentis/effectful-store'
import {
  GetResource,
  SearchResources,
  CreateResource,
  UpdateResource,
  DeleteResource,
  ClinicalResource,
} from './requests'

/**
 * Helper to decode and assert resource has ID
 */
const decodeAndAssertId = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  schema: Schema.Schema<A, I, never>
) => {
  const decode = Schema.decodeUnknown(schema)

  return (
    result: unknown
  ): Effect.Effect<WithId<A>, ExternalAssertionError, never> =>
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

      const resourceWithId: WithId<A> = yield* assertId(decoded).pipe(
        Effect.mapError(
          (cause) =>
            new ExternalAssertionError({
              expected: 'Expected resource to have id',
              cause,
            })
        )
      )

      return resourceWithId
    })
}

/**
 * Helper to decode a Bundle of resources
 */
const makeBundleDecoder = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  schema: Schema.Schema<A, I, never>
) => {
  const DataBundle = Bundle(schema)
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
        ): Effect.Effect<readonly WithId<A>[], ExternalAssertionError, never> =>
          Effect.all(
            entries.map(
              refineOrFail<ExternalAssertionError, undefined | A, WithId<A>>(
                (entry: A | undefined): entry is WithId<A> =>
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

/**
 * Creates a resolver for GetResource requests that batches reads
 */
export const makeGetResourceResolver = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
): RequestResolver.RequestResolver<
  GetResource<A>,
  never
> => {
  const decoder = decodeAndAssertId(schema)
  const bundleDecoder = makeBundleDecoder(schema)

  return RequestResolver.makeBatched(
    (requests: ReadonlyArray<GetResource<A>>) =>
      Effect.gen(function* () {
        // Group by resourceType (though they should all be the same)
        const byType = groupBy(requests, (r) => r.resourceType)

        for (const [resType, reqs] of byType) {
          if (reqs.length === 1) {
            // Single read → client.read()
            const result = yield* client.read({
              resourceType: resType,
              id: reqs[0].id,
            }).pipe(
              Effect.matchEffect({
                onFailure: (error) =>
                  Request.fail(
                    reqs[0],
                    error as NotFoundError<
                      A['resourceType'],
                      { id: string }
                    >
                  ),
                onSuccess: (raw) =>
                  decoder(raw).pipe(
                    Effect.matchEffect({
                      onFailure: (error) => Request.fail(reqs[0], error),
                      onSuccess: (decoded) => Request.succeed(reqs[0], decoded),
                    })
                  ),
              })
            )
          } else {
            // Batch → client.search({ _id: [id1, id2, ...] })
            const ids = reqs.map((r) => r.id)
            const result = yield* client.search({
              resourceType: resType,
              _id: ids.join(','),
            }).pipe(
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
                            resourceType: resourceType as A['resourceType'],
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
}

/**
 * Creates a resolver for SearchResources requests
 */
export const makeSearchResourcesResolver = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
): RequestResolver.RequestResolver<
  SearchResources<A>,
  never
> => {
  const bundleDecoder = makeBundleDecoder(schema)

  return RequestResolver.fromEffect((request: SearchResources<A>) =>
    client
      .search({ resourceType, ...request.params })
      .pipe(Effect.flatMap(bundleDecoder))
  )
}

/**
 * Creates a resolver for CreateResource requests
 */
export const makeCreateResourceResolver = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
): RequestResolver.RequestResolver<
  CreateResource<A>,
  never
> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)

  return RequestResolver.fromEffect((request: CreateResource<A>) =>
    encode(request.resource).pipe(
      Effect.mapError(
        (cause) =>
          new UnhandledError({ message: 'Error encoding resource', cause })
      ),
      Effect.flatMap((resource) =>
        client.create({
          type: resourceType,
          resource,
        })
      ),
      Effect.flatMap(decoder)
    )
  )
}

/**
 * Creates a resolver for UpdateResource requests
 */
export const makeUpdateResourceResolver = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
): RequestResolver.RequestResolver<
  UpdateResource<A>,
  never
> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)

  return RequestResolver.fromEffect((request: UpdateResource<A>) => {
    const originalId = request.resource.id
    return encode(request.resource).pipe(
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
  })
}

/**
 * Creates a resolver for DeleteResource requests
 */
export const makeDeleteResourceResolver = <
  A extends Element<string> & { resourceType: string },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType']
): RequestResolver.RequestResolver<
  DeleteResource<A>,
  never
> => {
  return RequestResolver.fromEffect((request: DeleteResource<A>) =>
    client.delete({ type: resourceType, id: request.id })
  )
}

/**
 * Creates all resolvers for a given resource type
 */
export const makeFhirResolvers = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  client: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
) => ({
  get: makeGetResourceResolver(client, resourceType, schema),
  search: makeSearchResourcesResolver(client, resourceType, schema),
  create: makeCreateResourceResolver(client, resourceType, schema),
  update: makeUpdateResourceResolver(client, resourceType, schema),
  delete: makeDeleteResourceResolver(client, resourceType),
})
