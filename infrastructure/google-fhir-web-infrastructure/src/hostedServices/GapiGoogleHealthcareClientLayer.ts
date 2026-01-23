import { Effect, Schedule, Scope } from 'effect'
import {
  FhirR4Client,
  buildFhirStoreParent,
  buildFhirResourcePath,
  createFhirResponseHandlers,
} from '@assessmentis/fhir-client'
import { buildSearchParams } from '@assessmentis/util'
import { LoadedGapiClient } from '../services/LoadedGapiClient'
import {
  GapiHealthcareClient,
  LoadedGapiHealthcareClient,
} from '../services/LoadedGapiHealthcareClient'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { ExternalAssertionError, UnhandledError } from '@assessmentis/ontology'

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

type FhirResp = gapi.client.Response<gapi.client.healthcare.HttpBody>

export const startGapiGoogleHealthcareClient: Effect.Effect<
  typeof FhirR4Client.Service,
  ExternalAssertionError,
  | Scope.Scope
  | LoadedGapiClient
  | LoadedGapiHealthcareClient
  | LoadedGoogleFhirConfig
> = Effect.gen(function* () {
  const { projectId, dataset, region, storeId } = yield* LoadedGoogleFhirConfig
  const client = yield* yield* LoadedGapiClient

  const healthcare = yield* LoadedGapiHealthcareClient

  const parent = buildFhirStoreParent({ projectId, dataset, region, storeId })

  const handlers = createFhirResponseHandlers<
    { status?: number | undefined },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi.client.Response<any>,
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

  const read: (typeof FhirR4Client.Service)['read'] = ({
    resourceType,
    id,
  }: {
    resourceType: string
    id: string
  }) =>
    Effect.tryPromise({
      try: () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: buildFhirResourcePath(parent, resourceType, id),
        }),
      catch: (cause) => {
        return new UnhandledError({
          message: 'Error reading FHIR resource',
          cause,
        })
      },
    }).pipe(
      Effect.flatMap((resp) =>
        handlers.handleReadResponse(resp, { resourceType, id })
      ),
      Effect.map((response) => response.result)
    )

  const search: (typeof FhirR4Client.Service)['search'] = (
    params: Record<string, string | undefined> & { resourceType: string }
  ) => {
    const { resourceType, ...searchParams } = params
    return Effect.tryPromise({
      try: () =>
        client.request({
          path: `https://content-healthcare.googleapis.com/v1/${parent}/fhir/${resourceType}/_search?${buildSearchParams(searchParams)}`,
          method: 'POST',
          headers: {
            'content-type': 'application/fhir+json;charset=utf-8',
          },
          body: '',
        }),
      catch: (cause) => {
        return new UnhandledError({
          message: 'Error searching FHIR server',
          cause,
        })
      },
    }).pipe(
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
    Effect.tryPromise({
      try: () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.create(
          {
            parent,
            type,
            resource: resource as gapi.client.healthcare.HttpBody,
          }
        ),
      catch: (cause) => {
        return new UnhandledError({
          message: 'Error creating FHIR resource',
          cause,
        })
      },
    }).pipe(
      Effect.flatMap((resp) => handlers.handleCreateResponse(resp)),
      Effect.map((response) => response.result)
    )

  const update: (typeof FhirR4Client.Service)['update'] = ({
    id,
    type,
    resource,
  }: {
    id: string
    type: string
    resource: unknown
  }) =>
    Effect.tryPromise({
      try: () =>
        healthcare.projects.locations.datasets.fhirStores.fhir.update({
          name: buildFhirResourcePath(parent, type, id),
          resource: resource as gapi.client.healthcare.HttpBody,
        }),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error updating FHIR ${type}`,
          cause,
        })
      },
    }).pipe(
      Effect.flatMap((resp) =>
        handlers.handleUpdateResponse(resp, {
          resourceType: type,
          id,
        })
      ),
      Effect.map((response) => response.result)
    )

  const deleteResource: (typeof FhirR4Client.Service)['delete'] = ({
    id,
    type,
  }: {
    id: string
    type: string
  }) =>
    Effect.tryPromise({
      try: () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.delete(
          {
            name: buildFhirResourcePath(parent, type, id),
          }
        ),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error deleting FHIR ${type}`,
          cause,
        })
      },
    }).pipe(
      Effect.flatMap((resp) =>
        handlers.handleDeleteResponse(resp, {
          resourceType: type,
          id,
        })
      ),
      Effect.asVoid
    )

  const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
    bundle
  ) =>
    Effect.tryPromise({
      try: () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle(
          {
            parent,
            resource: bundle as gapi.client.healthcare.HttpBody,
          }
        ),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error executing FHIR bundle`,
          cause,
        })
      },
    }).pipe(
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
