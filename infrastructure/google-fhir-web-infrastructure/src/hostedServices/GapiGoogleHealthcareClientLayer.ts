import { Effect } from 'effect'
import type { UnknownException } from 'effect/Cause'

import type { GoogleFhirConfig } from '@assessmentis/config-domain'
import {
  buildFhirResourcePath,
  buildFhirStoreParent,
  createFhirResponseHandlers,
  type FhirR4Client,
} from '@assessmentis/fhir-r4'
import { UnhandledError, type AuthError } from '@assessmentis/ontology'
import { buildSearchParams } from '@assessmentis/util'

import type { GapiClient } from '../services/LoadedGapiClient'
import type { GapiHealthcareClient } from '../services/LoadedGapiHealthcareClient'

interface GapiErrorResponse {
  // The raw response string.
  body: string

  // HTTP status
  status?: number | undefined

  // HTTP status text
  statusText?: string | undefined
}

const tryToGapiErrorResponse = (error: unknown): GapiErrorResponse | null => {
  if (typeof error !== 'object' || error === null) return null
  if (!('body' in error) || typeof error.body !== 'string') return null
  if (
    'status' in error &&
    error.status != null &&
    error.status !== undefined &&
    typeof error.status !== 'number'
  )
    return null
  if (
    'statusText' in error &&
    error.statusText != null &&
    error.statusText !== undefined &&
    typeof error.statusText !== 'string'
  )
    return null

  return {
    body: error.body,
    status: (error as { status?: number }).status ?? undefined,
    statusText: (error as { statusText?: string }).statusText ?? undefined,
  }
}

const recoverGapiHttpError: <A, R>(
  eff: Effect.Effect<A, UnknownException, R>
) => Effect.Effect<A | GapiErrorResponse, UnhandledError, R> = Effect.catchAll(
  (error): Effect.Effect<GapiErrorResponse, UnhandledError, never> => {
    const maybeGapiError = tryToGapiErrorResponse(error.error)

    if (maybeGapiError === null)
      return Effect.fail(
        new UnhandledError({ message: error.message, cause: error.error })
      )

    return Effect.succeed(maybeGapiError)
  }
)

export const makeGapiGoogleHealthcareClient = ({
  getAccessToken,
  gapiClient,
  healthcare,
  config,
}: {
  getAccessToken: Effect.Effect<string, AuthError | UnhandledError>
  gapiClient: GapiClient
  healthcare: GapiHealthcareClient
  config: GoogleFhirConfig
}): typeof FhirR4Client.Service => {
  const { projectId, dataset, region, storeId } = config

  const parent = buildFhirStoreParent({
    projectId,
    dataset,
    region,
    storeId,
  })

  const handlers = createFhirResponseHandlers<
    { status?: number | undefined },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GapiErrorResponse | gapi.client.Response<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi.client.Response<any>
  >({
    isNotFound: (resp) => resp.status === 404 || resp.status === 410,
    isUnauthorized: (resp) => resp.status === 403,
    isUnauthenticated: (resp) => resp.status === 401,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isSuccess: (resp): resp is gapi.client.Response<any> =>
      resp.status !== undefined && resp.status >= 200 && resp.status < 300,
  })

  /** Resolve the current access token, then run `fn` with it. */
  const withToken = <A, E, R>(
    fn: (access_token: string) => Effect.Effect<A, E, R>
  ) => Effect.flatMap(getAccessToken, fn)

  const read: (typeof FhirR4Client.Service)['read'] = <
    ResourceType extends string,
  >({
    domainType: resourceType,
    id,
  }: {
    domainType: ResourceType
    id: string
  }) =>
    withToken((access_token) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: buildFhirResourcePath(parent, resourceType, id),
          access_token,
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) =>
          handlers.handleReadResponse(resp, { resourceType, id })
        ),
        Effect.map((response) => response.result)
      )
    )

  const search: (typeof FhirR4Client.Service)['search'] = (params) => {
    const { resourceType, ...searchParams } = params
    return withToken((access_token) =>
      Effect.tryPromise(() =>
        // Uses a raw gapiClient.request instead of the healthcare SDK because
        // the SDK's search method doesn't support _search POST with params.
        // Bearer header is required here because gapiClient.request doesn't
        // inject auth automatically (unlike the healthcare SDK methods which
        // accept access_token as a parameter).
        gapiClient.request({
          path: `https://content-healthcare.googleapis.com/v1/${parent}/fhir/${resourceType}/_search?${buildSearchParams(searchParams)}`,
          method: 'POST',
          headers: {
            'content-type': 'application/fhir+json;charset=utf-8',
            Authorization: `Bearer ${access_token}`,
          },
          body: '',
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) => handlers.handleSearchResponse(resp)),
        Effect.map((response) => response.result as unknown)
      )
    )
  }

  const create: (typeof FhirR4Client.Service)['create'] = ({
    domainType: type,
    resource,
  }: {
    domainType: string
    resource: unknown
  }) =>
    withToken((access_token) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.create({
          parent,
          type,
          resource: resource as gapi.client.healthcare.HttpBody,
          access_token,
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) => handlers.handleCreateResponse(resp)),
        Effect.map((response) => response.result)
      )
    )

  const update: (typeof FhirR4Client.Service)['update'] = <
    ResourceType extends string,
  >({
    id,
    domainType: type,
    resource,
  }: {
    id: string
    domainType: ResourceType
    resource: unknown
  }) =>
    withToken((access_token) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.update({
          name: buildFhirResourcePath(parent, type, id),
          resource: resource as gapi.client.healthcare.HttpBody,
          access_token,
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) =>
          handlers.handleUpdateResponse<ResourceType>(resp, {
            resourceType: type,
            id,
          })
        ),
        Effect.map((response) => response.result)
      )
    )

  const deleteResource: (typeof FhirR4Client.Service)['delete'] = <
    ResourceType extends string,
  >({
    id,
    domainType: type,
  }: {
    id: string
    domainType: ResourceType
  }) =>
    withToken((access_token) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.delete({
          name: buildFhirResourcePath(parent, type, id),
          access_token,
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) =>
          handlers.handleDeleteResponse<ResourceType>(resp, {
            resourceType: type,
            id,
          })
        ),
        Effect.asVoid
      )
    )

  const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
    bundle
  ) =>
    withToken((access_token) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle({
          parent,
          resource: bundle as gapi.client.healthcare.HttpBody,
          access_token,
        })
      ).pipe(
        recoverGapiHttpError,
        Effect.flatMap((resp) => handlers.handleExecuteBundleResponse(resp)),
        Effect.map((response) => response.result)
      )
    )

  return {
    read,
    search,
    create,
    update,
    delete: deleteResource,
    executeBundle,
  }
}
