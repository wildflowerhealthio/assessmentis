/*
 * This file uses `any` type casts in several places to work around TypeScript's
 * limitations when dealing with generic request/resolver types. These casts are
 * safe because:
 * 1. The actual types are enforced by the public API signatures
 * 2. The runtime behavior is validated by the Effect-TS Request/RequestResolver system
 * 3. Each resolver is strongly typed based on the Key parameter
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Array, Record, Effect, Request, RequestResolver, Schema } from 'effect'
import type { FhirR4Client } from '@assessmentis/fhir-client'
import type {
  ClinicalDataRepositoryErrors,
  ClinicalResources,
} from '@assessmentis/clinical-domain'
import type { Element } from '@assessmentis/clinical-domain/data-types'
import type { WithId } from '@assessmentis/effectful-store'
import { assertId } from '@assessmentis/effectful-store'
import { BundleFromFhirR4 } from '@assessmentis/clinical-domain/foundation-framework'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { refineOrFail } from '@assessmentis/util'

/**
 * Helper to decode and assert resource has ID
 */
const decodeAndAssertId = <T extends { id?: string }>(
  schema: Schema.Schema<T, T, never>
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
const makeBundleDecoder = <
  A extends Element<string> & { readonly resourceType: string },
  I extends { readonly resourceType: string; readonly id?: string | undefined },
>(
  schema: Schema.Schema<A, I, never>
) => {
  const DataBundle = BundleFromFhirR4(schema)
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
        ): Effect.Effect<
          readonly WithId<A>[],
          ExternalAssertionError & ClinicalDataRepositoryErrors,
          never
        > =>
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
 * Creates a resolver for GetClinicalResource requests that batches reads
 */
export const makeGetResourceResolver = <
  TReq extends
    ClinicalResources.Requests[keyof ClinicalResources.Requests]['Get'],
>(
  client: typeof FhirR4Client.Service,
  resourceType: TReq['resourceType'],
  schema: Schema.Schema<any, any, never>
): RequestResolver.RequestResolver<TReq, never> => {
  const decoder = decodeAndAssertId(schema)
  const bundleDecoder = makeBundleDecoder(schema)

  return RequestResolver.makeBatched(
    (requests: ReadonlyArray<TReq>) =>
      Effect.gen(function* () {
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
                  onFailure: (error) => Request.fail(reqs[0], error as any),
                  onSuccess: (raw) =>
                    decoder(raw).pipe(
                      Effect.matchEffect({
                        onFailure: (error) =>
                          Request.fail(reqs[0], error as any),
                        onSuccess: (decoded) =>
                          Request.succeed(reqs[0], decoded as any),
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
                    Effect.all(
                      reqs.map((req) => Request.fail(req, error as any))
                    ),
                  onSuccess: (entries) =>
                    Effect.gen(function* () {
                      // Match results back to requests by id
                      for (const req of reqs) {
                        const match = entries.find((e) => e.id === req.id)
                        if (match) {
                          yield* Request.succeed(req, match as any)
                        } else {
                          yield* Request.fail(
                            req,
                            new NotFoundError({
                              resourceType: resourceType,
                              params: { id: req.id },
                            }) as any
                          )
                        }
                      }
                    }),
                })
              )
          }
        }
      }) as any
  )
}

/**
 * Creates a resolver for SearchClinicalResources requests
 */
export const makeSearchResourcesResolver = <
  T extends ClinicalResources.Types[keyof ClinicalResources.Types],
>(
  client: typeof FhirR4Client.Service,
  resourceType: T['resourceType'],
  schema: Schema.Schema<T, T, never>
): RequestResolver.RequestResolver<
  ClinicalResources.Requests[T['resourceType']]['Search'],
  never
> => {
  const bundleDecoder = makeBundleDecoder(schema)

  return RequestResolver.fromEffect(((
    request: ClinicalResources.Requests[T['resourceType']]['Search']
  ) =>
    client
      .search({ resourceType, ...(request.params as any) })
      .pipe(
        Effect.flatMap(bundleDecoder)
      )) as any) as RequestResolver.RequestResolver<
    ClinicalResources.Requests[T['resourceType']]['Search'],
    never
  >
}

/**
 * Creates a resolver for CreateClinicalResource requests
 */
export const makeCreateResourceResolver = <
  T extends ClinicalResources.Types[keyof ClinicalResources.Types],
>(
  client: typeof FhirR4Client.Service,
  resourceType: T['resourceType'],
  schema: Schema.Schema<T, T, never>
): RequestResolver.RequestResolver<
  ClinicalResources.Requests[T['resourceType']]['Create'],
  never
> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)

  return RequestResolver.fromEffect(((
    request: ClinicalResources.Requests[T['resourceType']]['Create']
  ) =>
    encode(request.resource as any).pipe(
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
    )) as any) as RequestResolver.RequestResolver<
    ClinicalResources.Requests[T['resourceType']]['Create'],
    never
  >
}

/**
 * Creates a resolver for UpdateClinicalResource requests
 */
export const makeUpdateResourceResolver = <
  T extends ClinicalResources.Types[keyof ClinicalResources.Types],
>(
  client: typeof FhirR4Client.Service,
  resourceType: T['resourceType'],
  schema: Schema.Schema<T, T, never>
): RequestResolver.RequestResolver<
  ClinicalResources.Requests[T['resourceType']]['Update'],
  never
> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)

  return RequestResolver.fromEffect(((
    request: ClinicalResources.Requests[T['resourceType']]['Update']
  ) => {
    const originalId = request.resource.id
    return encode(request.resource as any).pipe(
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
  }) as any) as RequestResolver.RequestResolver<
    ClinicalResources.Requests[T['resourceType']]['Update'],
    never
  >
}

/**
 * Creates a resolver for DeleteClinicalResource requests
 */
export const makeDeleteResourceResolver = <
  T extends ClinicalResources.Types[keyof ClinicalResources.Types],
>(
  client: typeof FhirR4Client.Service,
  resourceType: T['resourceType']
): RequestResolver.RequestResolver<
  ClinicalResources.Requests[T['resourceType']]['Delete'],
  never
> => {
  const a = RequestResolver.fromEffect(
    (request: ClinicalResources.Requests[T['resourceType']]['Delete']) => {
      const deleteAct = client
        .delete<T['resourceType']>({
          type: resourceType,
          id: request.id,
        })
        .pipe(
          Effect.catchTag('NotFoundError', () =>
            Effect.fail(
              new NotFoundError<
                T['resourceType'],
                { id: NonNullable<T['id']> }
              >({
                resourceType,
                params: { id: request.id },
              })
            )
          ),
          Effect.as(null)
        )
      return deleteAct as any
    }
  )
  return a as any
}

/**
 * Creates all resolvers for a given resource type
 */
export const makeFhirResolvers = <
  T extends ClinicalResources.Types[keyof ClinicalResources.Types],
>(
  client: typeof FhirR4Client.Service,
  resourceType: T['resourceType'],
  schema: Schema.Schema<T, T, never>
) => {
  type Requests = ClinicalResources.Requests[T['resourceType']]
  return {
    Get: makeGetResourceResolver<Requests['Get']>(client, resourceType, schema),
    Search: makeSearchResourcesResolver<T>(client, resourceType, schema),
    Create: makeCreateResourceResolver<T>(client, resourceType, schema),
    Update: makeUpdateResourceResolver<T>(client, resourceType, schema),
    Delete: makeDeleteResourceResolver<T>(client, resourceType),
  }
}
