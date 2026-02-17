/*
 * This file uses `any` type casts in several places to work around TypeScript's
 * limitations when dealing with generic request/resolver types. These casts are
 * safe because:
 * 1. The actual types are enforced by the public API signatures
 * 2. The runtime behavior is validated by the Effect-TS Request/RequestResolver system
 * 3. Each resolver is strongly typed based on the Key parameter
 */

import { Array, Record, Effect, Request, RequestResolver, Schema } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import type {
  BaseResource,
  WithId,
  Requests,
} from '@assessmentis/effectful-store'
import { assertId } from '@assessmentis/effectful-store'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { refineOrFail } from '@assessmentis/util'
import { FhirR4Bundle } from './foundation-framework'

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

export interface FhirR4ResourceBehaviour<
  T extends BaseResource,
  TEncoded = unknown,
> {
  resourceType: T['resourceType']
  Schema: Schema.Schema<T, TEncoded, never>
  Get: RequestResolver.RequestResolver<Requests.Get<T>, FhirR4Client>
  Search: RequestResolver.RequestResolver<Requests.Search<T>, FhirR4Client>
  Create: RequestResolver.RequestResolver<Requests.Create<T>, FhirR4Client>
  Update: RequestResolver.RequestResolver<Requests.Update<T>, FhirR4Client>
  Delete: RequestResolver.RequestResolver<Requests.Delete<T>, FhirR4Client>
}

export const FhirR4ResourceBehaviourImpl = <T extends BaseResource, TEncoded>({
  resourceType,
  Schema: schema,
}: {
  resourceType: T['resourceType']
  Schema: Schema.Schema<T, TEncoded, never>
}): FhirR4ResourceBehaviour<T, TEncoded> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertId(schema)
  const bundleDecoder = makeBundleDecoder(schema)

  const Get = RequestResolver.makeBatched(
    (requests: ReadonlyArray<Requests.Get<T>>) =>
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

  const Search = RequestResolver.fromEffect((request: Requests.Search<T>) =>
    Effect.flatMap(FhirR4Client, (client) =>
      client
        .search({ resourceType: request.resourceType, ...request.params })
        .pipe(Effect.flatMap(bundleDecoder))
    )
  )

  const Create = RequestResolver.fromEffect((request: Requests.Create<T>) =>
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

  const Update = RequestResolver.fromEffect((request: Requests.Update<T>) => {
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
  })

  const Delete = RequestResolver.fromEffect((request: Requests.Delete<T>) =>
    Effect.flatMap(FhirR4Client, (client) =>
      client
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
    )
  )

  return {
    resourceType,
    Schema: schema,
    Get,
    Search,
    Create,
    Update,
    Delete,
  }
}
