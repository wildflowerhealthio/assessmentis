/*
 * This file bridges the FHIR R4 client (which uses {resourceType, id}) with
 * the effectful-store request system (which uses {domainType, url}).
 *
 * The FhirR4 schemas are in a transitional state — their base data-type schemas
 * don't yet produce clinical-domain types with url/domainType. Once the base
 * schemas are updated, many of the bridge helpers here can be simplified.
 */

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
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import {
  type ResourceRequest,
  type SourceBehaviour,
} from '@assessmentis/effectful-store'
import type { AuthError } from '@assessmentis/ontology'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { StreamEither } from '@assessmentis/util'
import { refineOrFail } from '@assessmentis/util'
import { FhirR4Bundle } from './foundation-framework'
import type {
  Composition,
  DiagnosticReport,
  Location,
  Media,
  Observation,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type { Encounter, Patient } from '@assessmentis/clinical-domain'
import {
  FhirR4Encounter,
  FhirR4Location,
  FhirR4Patient,
  FhirR4Practitioner,
} from './administration'
import {
  FhirR4Composition,
  FhirR4Questionnaire,
  FhirR4QuestionnaireResponse,
} from './content-management'
import {
  FhirR4DiagnosticReport,
  FhirR4Media,
  FhirR4Observation,
} from './diagnostic-medicine'
import { BaseUrl } from './data-types/UrlIdentification'

export const fhirProtocols = {
  http: 'fhir-r4+http:',
  https: 'fhir-r4+https:',
} as const

export type FhirR4Protocol = (typeof fhirProtocols)[keyof typeof fhirProtocols]

// Type alias (not interface) to provide implicit index signature for
// compatibility with MultiResolver/SourceBehaviour constraints
type Resources = {
  readonly Composition: Composition
  readonly DiagnosticReport: DiagnosticReport
  readonly Encounter: Encounter
  readonly Location: Location
  readonly Media: Media
  readonly Observation: Observation
  readonly Patient: Patient
  readonly Practitioner: Practitioner
  readonly Questionnaire: Questionnaire
  readonly QuestionnaireResponse: QuestionnaireResponse
}

// Explicit mapped type ensures FhirR4Schemas[K] resolves to Schema<Resources[K], ...>
// for generic K, rather than a union of all concrete schema types.

const FhirR4Schemas: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof Resources]: Schema.Schema<Resources[K], any, BaseUrl>
} = {
  Composition: FhirR4Composition.Schema,
  DiagnosticReport: FhirR4DiagnosticReport.Schema,
  Encounter: FhirR4Encounter.Schema,
  Location: FhirR4Location.Schema,
  Media: FhirR4Media.Schema,
  Observation: FhirR4Observation.Schema,
  Patient: FhirR4Patient.Schema,
  Practitioner: FhirR4Practitioner.Schema,
  Questionnaire: FhirR4Questionnaire.Schema,
  QuestionnaireResponse: FhirR4QuestionnaireResponse.Schema,
}

// --- Helpers ---

/**
 * Extract the FHIR resource ID from a ReadonlyUrl pathname.
 * URLs follow the pattern `.../{resourceType}/{id}`.
 */
const extractFhirId = (url: { readonly pathname: string }): string => {
  const segments = url.pathname.split('/')
  return segments[segments.length - 1]
}

/**
 * Type guard: asserts a resource has a non-undefined url
 */
const hasResourceUrl = <T extends Resource.AnyResource>(
  value: T
): value is Resource.WithResourceUrl<T> => value.url !== undefined

/**
 * Decode raw FHIR JSON and assert the result has a url
 */
const decodeAndAssertUrl = <T extends Resource.Resource<string>>(
  schema: Schema.Schema<T, unknown, BaseUrl>
) => {
  const decode = Schema.decodeUnknown(schema)

  return (
    result: unknown
  ): Effect.Effect<
    Resource.WithResourceUrl<T>,
    ExternalAssertionError,
    BaseUrl
  > =>
    decode(result).pipe(
      Effect.mapError(
        (cause) =>
          new ExternalAssertionError({
            expected: 'Expected resource to conform to schema',
            cause,
          })
      ),
      Effect.flatMap((decoded) =>
        hasResourceUrl(decoded)
          ? Effect.succeed(decoded)
          : Effect.fail(
              new ExternalAssertionError({
                expected: 'Expected resource to have url',
                cause: decoded,
              })
            )
      )
    )
}

/**
 * Decode a Bundle of resources
 */
const makeBundleDecoder = <T extends Resource.Resource<string>>(
  schema: Schema.Schema<T, unknown, BaseUrl>
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
      Effect.flatMap(
        (
          bundle
        ): Effect.Effect<
          readonly Resource.WithResourceUrl<T>[],
          ExternalAssertionError,
          never
        > => {
          // Explicitly type to prevent `any` propagation from broken base schemas
          const resources: readonly (T | undefined)[] =
            bundle.entry?.map(
              (e: { resource?: T | undefined }) => e.resource
            ) ?? []

          return Effect.all(
            resources.map(
              refineOrFail<
                ExternalAssertionError,
                undefined | T,
                Resource.WithResourceUrl<T>
              >(
                (entry: T | undefined): entry is Resource.WithResourceUrl<T> =>
                  entry !== undefined && entry.url !== undefined,
                (_) =>
                  new ExternalAssertionError({
                    expected:
                      'Expected resource entry to have a resource with a url',
                    cause: undefined,
                  })
              )
            )
          )
        }
      )
    )
}

const resolverForResource = <K extends keyof Resources>(request: {
  resourceType: K
}): AllActionResolver<Resources[K]> =>
  makeResolverSet({
    resourceType: request.resourceType,
    Schema: FhirR4Schemas[request.resourceType],
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
  url: ReadonlyUrl
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
        never
      > = RequestResolver.fromEffect((request) => {
        const innerResolver = resolverForResource(request)

        return Effect.request(
          request,
          innerResolver.pipe(
            RequestResolver.provideContext(
              Context.make(FhirR4Client, client).pipe(Context.add(BaseUrl, url))
            )
          )
        )
      })

      return resolver
    })
  )

  return {
    sourceId,
    sourceType,
    url: url.toString(),
    resolverStream,
    provokeReauth,
    activeResources: {
      Composition: true,
      DiagnosticReport: true,
      Encounter: true,
      Location: true,
      Media: true,
      Observation: true,
      Patient: true,
      Practitioner: true,
      Questionnaire: true,
      QuestionnaireResponse: true,
    },
  }
}

export interface FhirR4ResourceBehaviour<
  T extends Resource.Resource<string>,
  TEncoded = unknown,
> {
  resourceType: T[Resource.ResourceType]
  Schema: Schema.Schema<T, TEncoded, never>
}

type AllActionResolver<T extends Resource.Resource<string>> =
  RequestResolver.RequestResolver<
    | ResourceRequest.Get<T>
    | ResourceRequest.Search<T>
    | ResourceRequest.Create<T>
    | ResourceRequest.Update<T>
    | ResourceRequest.Delete<T>,
    FhirR4Client | BaseUrl
  >

const makeResolverSet = <T extends Resource.Resource<string>>({
  resourceType,
  Schema: schema,
}: {
  resourceType: T[Resource.ResourceType]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Schema: Schema.Schema<T, any, BaseUrl>
}): AllActionResolver<T> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertUrl(schema)
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
            const fhirId = extractFhirId(reqs[0].url)
            yield* client
              .read({
                resourceType: resType,
                id: fhirId,
              })
              .pipe(
                Effect.catchTag('NotFoundError', () =>
                  Effect.fail(
                    new NotFoundError({
                      resourceType: resourceType,
                      params: { url: reqs[0].url },
                    })
                  )
                ),
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
            const ids = reqs.map((r) => extractFhirId(r.url))
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
                      // Match results back to requests by url
                      for (const req of reqs) {
                        const reqId = extractFhirId(req.url)
                        const match = entries.find(
                          (e) => extractFhirId(e.url) === reqId
                        )
                        if (match) {
                          yield* Request.succeed(req, match)
                        } else {
                          yield* Request.fail(
                            req,
                            new NotFoundError({
                              resourceType: resourceType,
                              params: { url: req.url },
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
      const fhirId = extractFhirId(request.resource.url)
      return Effect.flatMap(FhirR4Client, (client) =>
        encode(request.resource).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({ message: 'Error encoding resource', cause })
          ),
          Effect.flatMap((resource) =>
            client.update({
              id: fhirId,
              type: resourceType,
              resource,
            })
          ),
          Effect.catchTag('NotFoundError', () =>
            Effect.fail(
              new NotFoundError({
                resourceType: resourceType,
                params: { url: request.resource.url },
              })
            )
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
          .delete({
            type: request.resourceType,
            id: extractFhirId(request.url),
          })
          .pipe(
            Effect.catchTag('NotFoundError', () =>
              Effect.fail(
                new NotFoundError({
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
          Get.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      case 'Search':
        return Effect.request(
          request,
          Search.pipe(
            RequestResolver.contextFromServices(FhirR4Client, BaseUrl)
          )
        )
      case 'Create':
        return Effect.request(
          request,
          Create.pipe(
            RequestResolver.contextFromServices(FhirR4Client, BaseUrl)
          )
        )
      case 'Update':
        return Effect.request(
          request,
          Update.pipe(
            RequestResolver.contextFromServices(FhirR4Client, BaseUrl)
          )
        )
      case 'Delete':
        return Effect.request(
          request,
          Delete.pipe(
            RequestResolver.contextFromServices(FhirR4Client, BaseUrl)
          )
        )
    }
  })
}
