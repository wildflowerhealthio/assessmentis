/*
 * This file bridges the FHIR R4 client (which uses {resourceType, id}) with
 * the effectful-store request system (which uses {domainType, url}).
 *
 * The FhirR4 schemas are in a transitional state — their base data-type schemas
 * don't yet produce clinical-domain types with url/domainType. Once the base
 * schemas are updated, many of the bridge helpers here can be simplified.
 */

import { Array, Context, Effect, Record, Request, RequestResolver, Schema } from 'effect'

import {
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
import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Origin, ReadonlyUrl, ResourceRequest } from '@assessmentis/effectful-store'
import { Resource, Search as SearchDSL } from '@assessmentis/effectful-store'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import { ExternalAssertionError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

import { BaseUrl } from './data-types/url-identification'
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

const fhirProtocols = {
  http: 'fhir-r4+http:',
  https: 'fhir-r4+https:',
} as const

type FhirR4Protocol = (typeof fhirProtocols)[keyof typeof fhirProtocols]

/** Union of all FHIR R4 domain class constructors supported by this origin. */
type SupportedClasses = ClinicalDomainClasses & {
  DomainType: keyof typeof FhirR4Schemas
}

// Explicit mapped type ensures FhirR4Schemas[K] resolves to Schema<InstanceType<K>, ...>
// For generic K, rather than a union of all concrete schema types.

const FhirR4Schemas = {
  [Composition.DomainType]: FhirR4Composition,
  [DiagnosticReport.DomainType]: FhirR4DiagnosticReport,
  [Encounter.DomainType]: FhirR4Encounter,
  [Location.DomainType]: FhirR4Location,
  [Media.DomainType]: FhirR4Media,
  [Observation.DomainType]: FhirR4Observation,
  [Patient.DomainType]: FhirR4Patient,
  [Practitioner.DomainType]: FhirR4Practitioner,
  [Questionnaire.DomainType]: FhirR4Questionnaire,
  [QuestionnaireResponse.DomainType]: FhirR4QuestionnaireResponse,
} as const

// --- Helpers ---

/**
 * Extract the FHIR resource ID from a ReadonlyUrl pathname.
 * URLs follow the pattern `.../{resourceType}/{id}`.
 */
const extractFhirId = (url: { readonly pathname: string }): string => {
  const segments = url.pathname.split('/')
  // Any split will have at least one segment (even
  //If the pathname is empty), so this is safe
  return segments.at(-1)!
}

/**
 * Decode raw FHIR JSON and assert the result has a url
 */
const decodeAndAssertUrl = <T extends Resource.Resource<string>>(
  schema: Schema.Schema<T, unknown, BaseUrl>
) => {
  const decode = Schema.decodeUnknown(schema)

  return (
    result: unknown
  ): Effect.Effect<Resource.WithResourceUrl<T>, ExternalAssertionError, BaseUrl> =>
    decode(result).pipe(
      Effect.mapError(
        (cause) =>
          new ExternalAssertionError({
            cause,
            expected: 'Expected resource to conform to schema',
          })
      ),
      Effect.flatMap((decoded) => {
        if (Resource.hasResourceUrl(decoded)) {
          return Effect.succeed(decoded)
        }
        return Effect.fail(
          new ExternalAssertionError({
            cause: decoded,
            expected: 'Expected resource to have url',
          })
        )
      })
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

  // oxlint-disable-next-line @typescript-eslint/explicit-function-return-type -- return type is complex Effect with BaseUrl context
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
        (bundle): Effect.Effect<readonly Resource.WithResourceUrl<T>[], ExternalAssertionError> => {
          // Explicitly type to prevent `any` propagation from broken base schemas
          const resources: readonly (T | undefined)[] =
            bundle.entry?.map((e: { resource?: T | undefined }) => e.resource) ?? []

          return Effect.all(
            resources.map((possibleResource) =>
              Effect.liftPredicate(
                possibleResource,
                (entry: T | undefined): entry is Resource.WithResourceUrl<T> =>
                  entry !== undefined && entry.url !== undefined,
                (_) =>
                  new ExternalAssertionError({
                    cause: undefined,
                    expected: 'Expected resource entry to have a resource with a url',
                  })
              )
            )
          )
        }
      )
    )
}

const resolverForResource = <Klass extends SupportedClasses>(request: {
  klass: Klass
}): AllActionResolver<Klass> =>
  makeResolverSet({
    Schema: FhirR4Schemas[request.klass.DomainType],
    klass: request.klass,
  })

const makeFhirR4ReadyOrigin = ({
  client,
  originUrl,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  client: FhirR4Client['Type']
  originUrl: ReadonlyUrl
  provokeReauthenticate: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
  provokeReauthorize: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
}): Origin.Ready<SupportedClasses> => {
  const resolver: ResourceRequest.MultiResolver<SupportedClasses, never> =
    RequestResolver.fromEffect((request) => {
      const innerResolver = resolverForResource(request)

      return Effect.request(
        request,
        innerResolver.pipe(
          RequestResolver.provideContext(
            Context.make(FhirR4Client, client).pipe(Context.add(BaseUrl, originUrl))
          )
        )
      )
    })

  return {
    errorStatus: undefined,
    originUrl,
    provokeReauthenticate,
    provokeReauthorize,
    resolver,
    supportedResources: {
      [Composition.DomainType]: Composition,
      [DiagnosticReport.DomainType]: DiagnosticReport,
      [Encounter.DomainType]: Encounter,
      [Location.DomainType]: Location,
      [Media.DomainType]: Media,
      [Observation.DomainType]: Observation,
      [Patient.DomainType]: Patient,
      [Practitioner.DomainType]: Practitioner,
      [Questionnaire.DomainType]: Questionnaire,
      [QuestionnaireResponse.DomainType]: QuestionnaireResponse,
    },
  }
}

type AllActionResolver<Klass extends Resource.AnyDomainClass> = RequestResolver.RequestResolver<
  | ResourceRequest.Get<Klass>
  | ResourceRequest.Search<Klass>
  | ResourceRequest.Create<Klass>
  | ResourceRequest.Update<Klass>
  | ResourceRequest.Delete<Klass>,
  FhirR4Client | BaseUrl
>

const makeResolverSet = <Klass extends SupportedClasses>({
  klass,
  Schema: schema,
}: {
  klass: Klass
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  Schema: Schema.Schema<any, any, BaseUrl>
}): AllActionResolver<Klass> => {
  const encode = Schema.encode(schema)
  const decoder = decodeAndAssertUrl(schema)
  const bundleDecoder = makeBundleDecoder(schema)

  const domainType = klass.DomainType

  const Get = RequestResolver.makeBatched((requests: readonly ResourceRequest.Get<Klass>[]) =>
    Effect.gen(function* getResolver() {
      const client = yield* FhirR4Client
      // Group by resourceType (though they should all be the same)
      const byType = Array.groupBy(requests, (r): Klass['DomainType'] => r.klass.DomainType)

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
                    // Force assert the `resourceType`
                    params: { url: reqs[0].url },
                    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                    resourceType: resType as Klass['DomainType'],
                  })
                )
              ),
              Effect.matchEffect({
                onFailure: (error) => Request.fail(reqs[0], error),
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
          const ids = reqs.map((r) => extractFhirId(r.url))
          yield* client
            .search({
              domainType: resType,
              id: ids,
            })
            .pipe(
              Effect.flatMap(bundleDecoder),
              Effect.matchEffect({
                onFailure: (error) => Effect.all(reqs.map((req) => Request.fail(req, error))),
                onSuccess: (entries) =>
                  Effect.gen(function* onSuccess() {
                    // Match results back to requests by url
                    for (const req of reqs) {
                      const reqId = extractFhirId(req.url)
                      const match = entries.find((e) => extractFhirId(e.url) === reqId)
                      if (match) {
                        yield* Request.succeed(req, match)
                      } else {
                        yield* Request.fail(
                          req,
                          new NotFoundError({
                            params: { url: req.url },
                            resourceType: domainType,
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

  const serializeConditions = (
    params: SearchDSL.QueryFor<SupportedClasses>
  ): Record<string, string | readonly string[]> => {
    const flat: Record<string, string | readonly string[]> = {}
    for (const [key, condition] of Object.entries(params)) {
      if (condition === undefined) continue
      flat[key] = SearchDSL.Condition.match(condition, {
        Exactly: ({ value }) => value,
        AnyOf: ({ values }) => [...values],
      })
    }
    return flat
  }

  const Search = RequestResolver.fromEffect((request: ResourceRequest.Search<SupportedClasses>) =>
    Effect.flatMap(FhirR4Client, (client) =>
      client
        .search({
          ...serializeConditions(request.params),
          domainType: request.klass.DomainType,
        })
        .pipe(Effect.flatMap(bundleDecoder))
    )
  )

  const Create = RequestResolver.fromEffect((request: ResourceRequest.Create<SupportedClasses>) =>
    Effect.flatMap(FhirR4Client, (client) =>
      encode(request.resource).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({
              cause,
              message: 'Error encoding resource',
            })
        ),

        Effect.flatMap((resource) =>
          client.create({
            domainType: request.klass.DomainType,
            resource,
          })
        ),
        Effect.flatMap(decoder)
      )
    )
  )

  const Update = RequestResolver.fromEffect((request: ResourceRequest.Update<SupportedClasses>) => {
    const fhirId = extractFhirId(request.resource.url)
    return Effect.flatMap(FhirR4Client, (client) =>
      encode(request.resource).pipe(
        Effect.mapError(
          (cause) => new UnhandledError({ cause, message: 'Error encoding resource' })
        ),
        Effect.flatMap((resource) =>
          client.update({
            domainType: domainType,
            id: fhirId,
            resource,
          })
        ),
        Effect.catchTag('NotFoundError', () =>
          Effect.fail(
            new NotFoundError({
              params: { url: request.resource.url },
              resourceType: domainType,
            })
          )
        ),
        Effect.flatMap(decoder)
      )
    )
  })

  const Delete = RequestResolver.fromEffect((request: ResourceRequest.Delete<SupportedClasses>) =>
    Effect.flatMap(FhirR4Client, (client) =>
      client
        .delete({
          domainType: request.klass.DomainType,
          id: extractFhirId(request.resource.url),
        })
        .pipe(
          Effect.catchTag('NotFoundError', () =>
            Effect.fail(
              new NotFoundError({
                params: { url: request.resource.url },
                resourceType: request.klass.DomainType,
              })
            )
          ),
          Effect.as(null)
        )
    )
  )

  return RequestResolver.fromEffect((request) => {
    switch (request._tag) {
      case 'Get': {
        return Effect.request(
          request,
          Get.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      }
      case 'Search': {
        return Effect.request(
          request,
          Search.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      }
      case 'Create': {
        return Effect.request(
          request,
          Create.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      }
      case 'Update': {
        return Effect.request(
          request,
          Update.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      }
      case 'Delete': {
        return Effect.request(
          request,
          Delete.pipe(RequestResolver.contextFromServices(FhirR4Client, BaseUrl))
        )
      }
    }
  })
}

export { fhirProtocols, makeFhirR4ReadyOrigin }
export type { FhirR4Protocol }
