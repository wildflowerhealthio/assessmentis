import { Effect, Schedule, Scope } from 'effect'
import {
  FhirR4Client,
  buildFhirStoreParent,
  buildFhirResourcePath,
  createFhirResponseHandlers,
} from '@assessmentis/fhir-client'
import { buildSearchParams } from '@assessmentis/util'
import { LoadedGapiClient } from '../services/LoadedGapiClient'
import { LoadedGapiHealthcareClient } from '../services/LoadedGapiHealthcareClient'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import {
  AuthError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'
import { UnknownException } from 'effect/Cause'

const _retryGoogle502s = <A extends { status: number }, E>(
  innerCall: Effect.Effect<A, E>
) =>
  Effect.retry(innerCall, {
    until: (err) => {
      console.error('FHIR API call error:', err)
      return err != 502
    },
    times: 3,
    schedule: Schedule.exponential('500 millis', 2),
  })

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

export const startGapiGoogleHealthcareClient: Effect.Effect<
  typeof FhirR4Client.Service,
  ExternalAssertionError | AuthError,
  | Scope.Scope
  | LoadedGapiClient
  | LoadedGapiHealthcareClient
  | LoadedGoogleFhirConfig
> = Effect.gen(function* () {
  const { projectId, dataset, region, storeId } = yield* LoadedGoogleFhirConfig
  const client = yield* yield* LoadedGapiClient

  yield* Effect.retry(
    Effect.suspend(() => {
      const token = client.getToken()?.access_token

      if (token) {
        return Effect.succeed(void 0)
      }
      return Effect.fail(AuthError.Unauthenticated())
    }),
    Schedule.addDelay(Schedule.recurs(10), () => '100 millis')
  )
  const healthcare = yield* LoadedGapiHealthcareClient

  const parent = buildFhirStoreParent({ projectId, dataset, region, storeId })

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

  const read: (typeof FhirR4Client.Service)['read'] = <
    ResourceType extends string,
  >({
    resourceType,
    id,
  }: {
    resourceType: ResourceType
    id: string
  }) =>
    Effect.tryPromise(() =>
      healthcare.projects.locations.datasets.fhirStores.fhir.read({
        name: buildFhirResourcePath(parent, resourceType, id),
      })
    ).pipe(
      recoverGapiHttpError,
      Effect.flatMap((resp) =>
        handlers.handleReadResponse(resp, { resourceType, id })
      ),
      Effect.map((response) => response.result)
    )

  const search: (typeof FhirR4Client.Service)['search'] = (
    params: Record<string, string | undefined> & { resourceType: string }
  ) => {
    const { resourceType, ...searchParams } = params
    return Effect.tryPromise(() =>
      client.request({
        path: `https://content-healthcare.googleapis.com/v1/${parent}/fhir/${resourceType}/_search?${buildSearchParams(searchParams)}`,
        method: 'POST',
        headers: {
          'content-type': 'application/fhir+json;charset=utf-8',
        },
        body: '',
      })
    ).pipe(
      recoverGapiHttpError,
      Effect.flatMap((resp) => handlers.handleSearchResponse(resp)),
      Effect.map((response) => response.result as unknown)
    )
  }

  const create: (typeof FhirR4Client.Service)['create'] = ({
    type,
    resource,
  }: {
    type: string
    resource: unknown
  }) =>
    Effect.tryPromise(() =>
      healthcare.projects.locations.datasets.fhirStores.fhir.create({
        parent,
        type,
        resource: resource as gapi.client.healthcare.HttpBody,
      })
    ).pipe(
      recoverGapiHttpError,
      Effect.flatMap((resp) => handlers.handleCreateResponse(resp)),
      Effect.map((response) => response.result)
    )

  const update: (typeof FhirR4Client.Service)['update'] = <
    ResourceType extends string,
  >({
    id,
    type,
    resource,
  }: {
    id: string
    type: ResourceType
    resource: unknown
  }) =>
    Effect.tryPromise(() =>
      healthcare.projects.locations.datasets.fhirStores.fhir.update({
        name: buildFhirResourcePath(parent, type, id),
        resource: resource as gapi.client.healthcare.HttpBody,
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

  const deleteResource: (typeof FhirR4Client.Service)['delete'] = <
    ResourceType extends string,
  >({
    id,
    type,
  }: {
    id: string
    type: ResourceType
  }) =>
    Effect.tryPromise(() =>
      healthcare.projects.locations.datasets.fhirStores.fhir.delete({
        name: buildFhirResourcePath(parent, type, id),
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

  const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
    bundle
  ) =>
    Effect.tryPromise(() =>
      healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle({
        parent,
        resource: bundle as gapi.client.healthcare.HttpBody,
      })
    ).pipe(
      recoverGapiHttpError,
      Effect.flatMap((resp) => handlers.handleExecuteBundleResponse(resp)),
      Effect.map((response) => response.result)
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
