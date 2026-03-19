import { Effect, Layer, Option } from 'effect'
import { UnknownException } from 'effect/Cause'

import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import {
  FhirR4Client,
  buildFhirResourcePath,
  buildFhirStoreParent,
  createFhirResponseHandlers,
} from '@assessmentis/fhir-r4'
import { UnhandledError } from '@assessmentis/ontology'
import { flattenSearchParams } from '@assessmentis/util'

import type { healthcare_v1 } from '@googleapis/healthcare'
import { google } from 'googleapis'
import { GaxiosError } from 'googleapis-common'
import type { GaxiosResponseWithHTTP2 } from 'googleapis-common'

import { GCloudAccessToken } from './g-cloud-access-token'

const recoverGaxiosError: <A, E, R>(
  eff: Effect.Effect<A, E | UnknownException, R>
) => Effect.Effect<A | GaxiosError<unknown>, E | UnknownException, R> = Effect.catchSome(
  (error) => {
    if (error instanceof UnknownException && error.error instanceof GaxiosError) {
      // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some is not an array method
      return Option.some(Effect.succeed(error.error as GaxiosError<unknown>))
    }
    return Option.none()
  }
)

const markExceptionUnhandled = <A, E, R>(
  eff: Effect.Effect<A, E | UnknownException, R>
): Effect.Effect<A, E | UnhandledError, R> =>
  Effect.mapError(eff, (error) => {
    if (error instanceof UnknownException) {
      return new UnhandledError({ cause: error.error, message: error.message })
    }
    return error
  })

const parseObjectFromResponse = (
  result: GaxiosResponseWithHTTP2<unknown>
): Effect.Effect<unknown, UnhandledError> => {
  const { data } = result
  if (data === null || data === undefined) {
    return Effect.succeed(data)
  }

  if (typeof data === 'object') {
    if ('text' in data && typeof data.text === 'function') {
      return Effect.tryPromise({
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        catch: (error) =>
          new UnhandledError({
            message: 'Failed to parse JSON response from Blob',
            cause: error,
          }),
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        try: async () => (data as Blob).text().then((text) => JSON.parse(text)),
      })
    }
    return Effect.succeed(data)
  }
  if (typeof data === 'string') {
    return Effect.try({
      catch: (error) =>
        new UnhandledError({
          message: 'Failed to parse JSON response from string',
          cause: error,
        }),
      try: () => JSON.parse(data),
    })
  }
  return Effect.fail(
    new UnhandledError({
      cause: data,
      message: 'Google response is not an object, Blob, or string',
    })
  )
}

export const NodeGoogleHealthcareFhirR4ClientLayer = Layer.effect(
  FhirR4Client,
  Effect.gen(function* NodeGoogleHealthcareFhirR4ClientLayer() {
    // Check for optional access token (useful for local dev with gcloud CLI)
    const accessTokenOption = yield* Effect.serviceOption(GCloudAccessToken)

    // Create auth - use access token if provided, otherwise use ADC
    const auth = Option.match(accessTokenOption, {
      onNone: () =>
        new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        }),
      onSome: ({ token }) => {
        const oauth2Client = new google.auth.OAuth2()
        oauth2Client.setCredentials({ access_token: token })
        return oauth2Client
      },
    })

    const healthcare = google.healthcare({
      auth,
      version: 'v1',
    })

    const { projectId, dataset, region, storeId } = yield* LoadedGoogleFhirConfig
    const parent = buildFhirStoreParent({ dataset, projectId, region, storeId })

    const handlers = createFhirResponseHandlers<
      {
        status?: number | undefined
      },
      GaxiosResponseWithHTTP2 | GaxiosError<unknown>,
      GaxiosResponseWithHTTP2
    >({
      isNotFound(resp) {
        // 404 not found, 410 gone
        return resp.status === 404 || resp.status === 410
      },
      isSuccess(resp): resp is GaxiosResponseWithHTTP2 {
        return (
          resp.status !== undefined && resp.status >= 200 && resp.status < 300 && 'data' in resp
        )
      },
      isUnauthenticated(resp) {
        return resp.status === 401
      },

      isUnauthorized(resp) {
        return resp.status === 403
      },
    })

    const read: (typeof FhirR4Client.Service)['read'] = ({ domainType: resourceType, id }) =>
      Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: buildFhirResourcePath(parent, resourceType, id),
        })
      ).pipe(
        recoverGaxiosError,
        (a) => a,
        Effect.flatMap((response) =>
          handlers.handleReadResponse(response, {
            id,
            resourceType,
          })
        ),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    const search: (typeof FhirR4Client.Service)['search'] = (params) => {
      const { domainType, ...searchParams } = params
      // Flatten array values to comma-separated strings for FHIR OR semantics
      // (gaxios would repeat keys for arrays, which is not FHIR-compliant)
      const flatParams = flattenSearchParams(searchParams)

      const hasParams = Object.keys(flatParams).length > 0
      let gaxiosOptions: { params: Record<string, string> } | undefined = undefined
      if (hasParams) {
        gaxiosOptions = { params: flatParams }
      }

      return Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.searchType(
          {
            parent,
            resourceType: domainType,
            ...(hasParams && {
              requestBody: {
                resourceType: domainType,
              },
            }),
          },
          gaxiosOptions
        )
      ).pipe(
        (a) => a,
        Effect.flatMap((response) => handlers.handleSearchResponse(response)),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )
    }

    const create: (typeof FhirR4Client.Service)['create'] = ({ domainType: type, resource }) =>
      Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.create({
          parent,
          type,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        (a) => a,
        Effect.flatMap((response) => handlers.handleCreateResponse(response)),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    const update: (typeof FhirR4Client.Service)['update'] = ({ id, domainType: type, resource }) =>
      Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.update({
          name: buildFhirResourcePath(parent, type, id),
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) =>
          handlers.handleUpdateResponse(response, { id, resourceType: type })
        ),
        Effect.flatMap((response) =>
          handlers.handleUpdateResponse(response, { id, resourceType: type })
        ),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    const deleteResource: (typeof FhirR4Client.Service)['delete'] = ({ id, domainType: type }) =>
      Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.delete({
          name: buildFhirResourcePath(parent, type, id),
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) =>
          handlers.handleDeleteResponse(response, { id, resourceType: type })
        ),
        markExceptionUnhandled,
        Effect.asVoid
      )

    const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (bundle) =>
      Effect.tryPromise(async () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle({
          parent,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          requestBody: bundle as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) => handlers.handleExecuteBundleResponse(response)),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    return {
      create,
      delete: deleteResource,
      executeBundle,
      read,
      search,
      update,
    }
  })
)
