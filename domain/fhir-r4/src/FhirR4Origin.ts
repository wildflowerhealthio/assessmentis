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
  Context,
  Effect,
  Record,
  Request,
  RequestResolver,
  Schema,
} from 'effect'

import type {
  Composition,
  DiagnosticReport,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import {
  type ReadonlyUrl,
  type Origin,
  type Resource,
  type ResourceRequest,
} from '@assessmentis/effectful-store'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import {
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
  type AuthError,
  type AuthzError,
} from '@assessmentis/ontology'

import { BaseUrl } from './data-types/UrlIdentification'
import { FhirR4Bundle } from './resources/Bundle'
import { FhirR4Composition } from './resources/Composition'
import { FhirR4DiagnosticReport } from './resources/DiagnosticReport'
import { FhirR4Encounter } from './resources/Encounter'
import { FhirR4Location } from './resources/Location'
import { FhirR4Media } from './resources/Media'
import { FhirR4Observation } from './resources/Observation'
import { FhirR4Patient } from './resources/Patient'
import { FhirR4Practitioner } from './resources/Practitioner'
import { FhirR4Questionnaire } from './resources/Questionnaire'
import { FhirR4QuestionnaireResponse } from './resources/QuestionnaireResponse'

export const fhirProtocols = {
  http: 'fhir-r4+http:',
  https: 'fhir-r4+https:',
} as const

export type FhirR4Protocol = (typeof fhirProtocols)[keyof typeof fhirProtocols]

// Type alias (not interface) to provide implicit index signature for
// compatibility with MultiResolver constraints
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
  Composition: FhirR4Composition,
  DiagnosticReport: FhirR4DiagnosticReport,
  Encounter: FhirR4Encounter,
  Location: FhirR4Location,
  Media: FhirR4Media,
  Observation: FhirR4Observation,
  Patient: FhirR4Patient,
  Practitioner: FhirR4Practitioner,
  Questionnaire: FhirR4Questionnaire,
  QuestionnaireResponse: FhirR4QuestionnaireResponse,
}

// --- Helpers ---

/**
 * Extract the FHIR resource ID from a ReadonlyUrl pathname.
 * URLs follow the pattern `.../{resourceType}/{id}`.
 */
const extractFhirId = (url: { readonly pathname: string }): string => {
  const segments = url.pathname.split('/')
  // Any split will have at least one segment (even
  //if  the pathname is empty), so this is safe
  return segments[segments.length - 1]!
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
            resources.map((possibleResource) =>
              Effect.liftPredicate(
                possibleResource,
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
  domainType: K
}): AllActionResolver<Resources[K]> =>
  makeResolverSet({
    domainType: request.domainType,
    Schema: FhirR4Schemas[request.domainType],
  })

export const makeFhirR4ReadyOrigin = ({
  client,
  originUrl,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  client: FhirR4Client['Type']
  originUrl: ReadonlyUrl
  provokeReauthenticate: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
  provokeReauthorize: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
}): Origin.Ready<Resources, keyof Resources> => {
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
          Context.make(FhirR4Client, client).pipe(
            Context.add(BaseUrl, originUrl)
          )
        )
      )
    )
  })

  return {
    originUrl,
    resolver,
    errorStatus: undefined,
    provokeReauthenticate,
    provokeReauthorize,
    supportedResources: {
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
  domainType,
  Schema: schema,
}: {
  domainType: T['domainType']
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
        const byType = Array.groupBy(requests, (r) => r.domainType)

        for (const [resType, reqs] of Record.toEntries(byType)) {
          if (reqs.length === 1) {
            // Single read → client.read()
            const fhirId = extractFhirId(reqs[0].url)
            yield* client
              .read({
                domainType: resType,
                id: fhirId,
              })
              .pipe(
                Effect.catchTag('NotFoundError', () =>
                  Effect.fail(
                    new NotFoundError({
                      resourceType: resType,
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
                domainType: resType,
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
                              resourceType: domainType,
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
          .search({ domainType: request.domainType, ...request.params })
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
              domainType: request.domainType,
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
              domainType: domainType,
              resource,
            })
          ),
          Effect.catchTag('NotFoundError', () =>
            Effect.fail(
              new NotFoundError({
                resourceType: domainType,
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
            domainType: request.domainType,
            id: extractFhirId(request.resource.url),
          })
          .pipe(
            Effect.catchTag('NotFoundError', () =>
              Effect.fail(
                new NotFoundError({
                  resourceType: request.domainType,
                  params: { url: request.resource.url },
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
