import { Effect, Schema } from 'effect'
import { refineOrFail } from '@assessmentis/util'
import type { Element, WithId } from '@assessmentis/clinical-domain/data-types'
import { hasId, assertId } from '@assessmentis/clinical-domain/data-types'
import { Bundle } from '@assessmentis/clinical-domain/foundation-framework'
import { UnhandledError, ExternalAssertionError } from '@assessmentis/ontology'
import type { FhirR4Client } from '@assessmentis/fhir-client'
import type { ClinicalDataRepository } from '../types'

export const makeClinicalDataRepository = <
  A extends Element<string> & { resourceType: string },
  I extends { resourceType: string; id?: string | undefined },
>(
  innerClient: typeof FhirR4Client.Service,
  resourceType: A['resourceType'],
  schema: Schema.Schema<A, I, never>
): ClinicalDataRepository<A> => {
  const encode = Schema.encode(schema)
  const decode = Schema.decodeUnknown(schema)

  const resourceArraySchema = Schema.Array(schema)
  const encodeResourceArraySchema = Schema.encode(resourceArraySchema)
  const decodeResourceArraySchema = Schema.decodeUnknown(resourceArraySchema)

  const DataBundle = Bundle(schema)
  const rawDecodeBundle = Schema.decodeUnknown(DataBundle)
  const decodeBundle = (encodedBundle: unknown) =>
    rawDecodeBundle(encodedBundle).pipe(
      Effect.mapError(
        (cause) =>
          new ExternalAssertionError({
            cause,
            expected: 'Search response could not be decoded as a Bundle',
          })
      )
    )
  /**
   * Decode and assert resource has ID
   */
  const decodeAndAssertId = (
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

  return {
    get: (id: NonNullable<A['id']>) =>
      innerClient
        .read({ resourceType, id })
        .pipe(Effect.flatMap(decodeAndAssertId)),

    getMany: (params = {}) =>
      innerClient.search({ resourceType, ...params }).pipe(
        Effect.flatMap(decodeBundle),
        Effect.map(({ entry }) => entry?.map((e) => e.resource) ?? []),
        Effect.flatMap(
          (
            entries
          ): Effect.Effect<
            readonly WithId<A>[],
            ExternalAssertionError,
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
      ),

    create: (resource: A) =>
      encode(resource).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({ message: 'Error encoding resource', cause })
        ),
        Effect.flatMap((resource) =>
          innerClient.create({
            type: resourceType,
            resource,
          })
        ),
        Effect.flatMap(decodeAndAssertId)
      ),

    update: (resource: WithId<A>) => {
      const originalId = resource.id
      return encode(resource).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({ message: 'Error encoding resource', cause })
        ),
        Effect.flatMap((resource) =>
          innerClient.update({
            id: originalId,
            type: resourceType,
            resource,
          })
        ),
        Effect.flatMap(decodeAndAssertId)
      )
    },
    delete: (id: NonNullable<A['id']>) =>
      innerClient.delete({ type: resourceType, id }),

    /**
     * Helper method for creating multiple resources using a FHIR bundle transaction.
     * Can be used for batch creation operations.
     */
    createMany: (resources: ReadonlyArray<A>) => {
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

      return Effect.gen(
        function* () {
          const encodedResources = yield* encodeResourceArraySchema(
            resources
          ).pipe(
            Effect.mapError(
              (cause) =>
                new UnhandledError({
                  message: 'Error encoding resources',
                  cause,
                })
            )
          )
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
          } as const

          const result = yield* innerClient.executeBundle(resource as any)

          const responseBundle = yield* Schema.decodeUnknown(
            TransactionResponseBundle
          )(result).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  expected: 'Response should be an transaction response bundle',
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

          const updated = yield* decodeResourceArraySchema(
            encodedResources.map(
              (resource, idx): WithId<I> => ({
                ...resource,
                id: ids[idx],
              })
            )
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  expected: 'Response should be an array of resources',
                  cause,
                })
            )
          )

          return updated
            .map((res): WithId<A> | undefined => {
              if (res != undefined && hasId(res)) {
                return res
              }
              return undefined
            })
            .filter((q): q is WithId<A> => q != undefined)
        }.bind(this)
      )
    },
  }
}
