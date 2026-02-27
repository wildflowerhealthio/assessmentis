import { Effect, Layer, Option } from 'effect'
import type { healthcare_v1 } from '@googleapis/healthcare'
import { google } from 'googleapis'
import type { GaxiosResponseWithHTTP2 } from 'googleapis-common'
import { GaxiosError } from 'googleapis-common'
import {
  FhirR4Client,
  buildFhirStoreParent,
  buildFhirResourcePath,
  createFhirResponseHandlers,
} from '@assessmentis/fhir-r4'
import { flattenSearchParams } from '@assessmentis/util'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnknownException } from 'effect/Cause'
import { UnhandledError } from '@assessmentis/ontology'
import { GCloudAccessToken } from './GCloudAccessToken'

const recoverGaxiosError: <A, E, R>(
  eff: Effect.Effect<A, E | UnknownException, R>
) => Effect.Effect<A | GaxiosError<unknown>, E | UnknownException, R> =
  Effect.catchSome((error) => {
    if (
      error instanceof UnknownException &&
      error.error instanceof GaxiosError
    ) {
      return Option.some(Effect.succeed(error.error as GaxiosError<unknown>))
    }
    return Option.none()
  })

const markExceptionUnhandled = <A, E, R>(
  eff: Effect.Effect<A, E | UnknownException, R>
): Effect.Effect<A, E | UnhandledError, R> =>
  Effect.mapError(eff, (error) =>
    error instanceof UnknownException
      ? new UnhandledError({ message: error.message, cause: error.error })
      : error
  )

const parseObjectFromResponse = (
  result: GaxiosResponseWithHTTP2<unknown>
): Effect.Effect<unknown, UnhandledError, never> => {
  const data = result.data
  if (data == null || data == undefined) return Effect.succeed(data)

  if (typeof data === 'object') {
    if ('text' in data && typeof data.text === 'function') {
      return Effect.tryPromise({
        try: () =>
          (data as Blob).text().then((text) => JSON.parse(text as string)),
        catch: (error) =>
          new UnhandledError({
            message: 'Failed to parse JSON response from Blob',
            cause: error,
          }),
      })
    }
    return Effect.succeed(data)
  } else if (typeof data === 'string') {
    return Effect.try({
      try: () => JSON.parse(data),
      catch: (error) =>
        new UnhandledError({
          message: 'Failed to parse JSON response from string',
          cause: error,
        }),
    })
  } else
    return Effect.fail(
      new UnhandledError({
        message: 'Google response is not an object, Blob, or string',
        cause: data,
      })
    )
}

export const NodeGoogleHealthcareFhirR4ClientLayer = Layer.effect(
  FhirR4Client,
  Effect.gen(function* () {
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
      version: 'v1',
      auth,
    })

    const { projectId, dataset, region, storeId } =
      yield* LoadedGoogleFhirConfig
    const parent = buildFhirStoreParent({ projectId, dataset, region, storeId })

    const handlers = createFhirResponseHandlers<
      {
        status?: number | undefined
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      GaxiosResponseWithHTTP2<any> | GaxiosError<unknown>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      GaxiosResponseWithHTTP2<any>
    >({
      isNotFound(resp) {
        // 404 not found, 410 gone
        return resp.status === 404 || resp.status == 410
      },
      isUnauthenticated(resp) {
        return resp.status === 401
      },
      isUnauthorized(resp) {
        return resp.status === 403
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isSuccess(resp): resp is GaxiosResponseWithHTTP2<any> {
        return (
          resp.status !== undefined &&
          resp.status >= 200 &&
          resp.status < 300 &&
          'data' in resp
        )
      },
    })

    const read: (typeof FhirR4Client.Service)['read'] = ({
      domainType: resourceType,
      id,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: buildFhirResourcePath(parent, resourceType, id),
        })
      ).pipe(
        recoverGaxiosError,
        (a) => a,
        Effect.flatMap((response) =>
          handlers.handleReadResponse(response, {
            resourceType,
            id,
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

      return Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.searchType(
          {
            parent,
            resourceType: domainType,
            ...(Object.keys(flatParams).length > 0 && {
              requestBody: {
                resourceType: domainType,
              },
            }),
          },
          Object.keys(flatParams).length > 0
            ? {
                params: flatParams,
              }
            : undefined
        )
      ).pipe(
        (a) => a,
        Effect.flatMap((response) => handlers.handleSearchResponse(response)),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )
    }

    const create: (typeof FhirR4Client.Service)['create'] = ({
      domainType: type,
      resource,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.create({
          parent,
          type,
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        (a) => a,
        Effect.flatMap((response) => handlers.handleCreateResponse(response)),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    const update: (typeof FhirR4Client.Service)['update'] = ({
      id,
      domainType: type,
      resource,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.update({
          name: buildFhirResourcePath(parent, type, id),
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) =>
          handlers.handleUpdateResponse(response, { resourceType: type, id })
        ),
        Effect.flatMap((response) =>
          handlers.handleUpdateResponse(response, { resourceType: type, id })
        ),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    const deleteResource: (typeof FhirR4Client.Service)['delete'] = ({
      id,
      domainType: type,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.delete({
          name: buildFhirResourcePath(parent, type, id),
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) =>
          handlers.handleDeleteResponse(response, { resourceType: type, id })
        ),
        markExceptionUnhandled,
        Effect.asVoid
      )

    const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
      bundle
    ) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle({
          parent,
          requestBody: bundle as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        recoverGaxiosError,
        Effect.flatMap((response) =>
          handlers.handleExecuteBundleResponse(response)
        ),
        markExceptionUnhandled,
        Effect.flatMap(parseObjectFromResponse)
      )

    return {
      read,
      search,
      create,
      update,
      delete: deleteResource,
      executeBundle,
    }
  })
)
