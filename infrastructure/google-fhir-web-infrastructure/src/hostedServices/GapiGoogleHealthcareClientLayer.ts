import { Effect, Schedule, Scope } from 'effect'
import { FhirR4Client } from '@assessmentis/clinical-domain/assessmentis'
import { LoadedGapiClient } from '../services/LoadedGapiClient'
import { LoadedGapiHealthcareClient } from '../services/LoadedGapiHealthcareClient'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import {
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { failEffectUnless } from '@assessmentis/util'

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

const handleAuthErr = failEffectUnless(
  ({ status }: FhirResp) => status != 401,
  (val) =>
    new AuthError({
      message: 'Unauthorized access to FHIR resource',
      cause: val.statusText,
    })
)

const handleAuthzErr = failEffectUnless(
  ({ status }: FhirResp) => status != 403,
  (val) =>
    new AuthzError({
      message: 'Forbidden access to FHIR resource',
      cause: val.statusText,
    })
)

const handleNotFoundErr = ({
  resourceType,
  id,
}: {
  resourceType: string
  id: string
}) =>
  failEffectUnless(
    ({ status }: FhirResp) => status != 404 && status != 410,
    (cause) =>
      new NotFoundError({
        resourceType,
        params: { id },
        cause,
      })
  )

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

  const parent = `projects/${projectId}/locations/${region}/datasets/${dataset}/fhirStores/${storeId}`

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
          name: `${parent}/fhir/${resourceType}/${id}`,
        }),
      catch: (cause) => {
        return new UnhandledError({
          message: 'Error reading FHIR resource',
          cause,
        })
      },
    }).pipe(
      handleAuthErr,
      handleAuthzErr,
      handleNotFoundErr({ resourceType, id }),
      Effect.map((response) => response.result)
    )

  const search: (typeof FhirR4Client.Service)['search'] = (
    params: Record<string, string | undefined> & { resourceType: string }
  ) =>
    Effect.tryPromise({
      try: () =>
        client.request({
          path: `https://content-healthcare.googleapis.com/v1/${parent}/fhir/${params.resourceType}/_search?${new URLSearchParams(
            Object.entries(params).filter(
              (pair): pair is [string, string] => pair[1] !== undefined
            )
          )}`,
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
      handleAuthErr,
      handleAuthzErr,
      Effect.map((response) => response.result as unknown)
    )

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
      handleAuthErr,
      handleAuthzErr,
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
          name: `${parent}/fhir/${type}/${id}`,
          resource: resource as gapi.client.healthcare.HttpBody,
        }),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error updating FHIR ${type}`,
          cause,
        })
      },
    }).pipe(
      handleAuthErr,
      handleAuthzErr,
      handleNotFoundErr({ resourceType: type, id }),
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
            name: `${parent}/fhir/${type}/${id}`,
          }
        ),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error deleting FHIR ${type}`,
          cause,
        })
      },
    }).pipe(
      handleAuthErr,
      handleAuthzErr,
      handleNotFoundErr({ resourceType: type, id }),
      Effect.asVoid
    )

  const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
    bundle
  ) =>
    Effect.tryPromise({
      try: () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle(
          {
            parent: parent,
            resource: bundle as gapi.client.healthcare.HttpBody,
          }
        ),
      catch: (cause) => {
        return new UnhandledError({
          message: `Error executing FHIR bundle`,
          cause,
        })
      },
    }).pipe(handleAuthErr, handleAuthzErr, Effect.asVoid)

  return {
    read,
    search,
    create,
    update,
    delete: deleteResource,
    executeBundle,
  }
})
