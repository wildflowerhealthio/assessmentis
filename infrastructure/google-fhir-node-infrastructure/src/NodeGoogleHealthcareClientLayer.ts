import { Effect, Layer } from 'effect'
import { healthcare_v1 } from '@googleapis/healthcare'
import { google } from 'googleapis'

import { FhirR4Client } from '@assessmentis/clinical-domain/assessmentis'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnhandledError, NotFoundError } from '@assessmentis/ontology'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import {
  HttpResponse,
  failOnHttpStatus,
  failOnHttpStatuses,
  buildFhirStoreParent,
  buildFhirResourcePath,
} from '@assessmentis/util'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'

/**
 * Adapter to convert googleapis response to HttpResponse
 */
const toHttpResponse = <T>(
  response: healthcare_v1.Schema$HttpBody
): HttpResponse<T> => ({
  status: 200, // googleapis throws on non-2xx, so successful responses are always 200
  data: response.data as T,
})

/**
 * Extracts status code from googleapis error
 */
const getErrorStatus = (error: unknown): number => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'number'
  ) {
    return error.code
  }
  return 500
}

/**
 * Converts googleapis error to HttpResponse for error handling
 */
const errorToHttpResponse = (error: unknown): HttpResponse => ({
  status: getErrorStatus(error),
  statusText: error instanceof Error ? error.message : String(error),
  data: error,
})

/**
 * Wraps any remaining errors as UnhandledError
 */
const catchUnhandledError = (message: string) =>
  Effect.catchAll((error: unknown) =>
    Effect.fail(
      new UnhandledError({
        message,
        cause: error,
      })
    )
  )

export const NodeGoogleHealthcareFhirR4ClientLayer = Layer.effect(
  FhirR4Client,
  Effect.gen(function* () {
    const _ = yield* FirebaseAdmin
    const healthcare = google.healthcare({
      version: 'v1',
      auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }),
    })

    const { projectId, dataset, region, storeId } =
      yield* LoadedGoogleFhirConfig
    const parent = buildFhirStoreParent({ projectId, dataset, region, storeId })

    const handleAuthErr = failOnHttpStatus(
      401,
      (resp: HttpResponse) =>
        new AuthError({
          message: 'Unauthorized access to FHIR resource',
          cause: resp.statusText,
        })
    )

    const handleAuthzErr = failOnHttpStatus(
      403,
      (resp: HttpResponse) =>
        new AuthzError({
          message: 'Forbidden access to FHIR resource',
          cause: resp.statusText,
        })
    )

    const handleNotFoundErr = ({
      resourceType,
      id,
    }: {
      resourceType: string
      id: string
    }) =>
      failOnHttpStatuses(
        [404, 410],
        (resp: HttpResponse) =>
          new NotFoundError({
            resourceType,
            params: { id },
            cause: resp,
          })
      )

    const read: (typeof FhirR4Client.Service)['read'] = ({
      resourceType,
      id,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.read({
              name: buildFhirResourcePath(parent, resourceType, id),
            })
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType, id }),
        catchUnhandledError('Error reading FHIR resource'),
        Effect.map((response) => response.data)
      )

    const search: (typeof FhirR4Client.Service)['search'] = (params) => {
      const { resourceType } = params

      return Effect.tryPromise({
        try: async () => {
          // Use searchType for resource-specific searches
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.searchType(
              {
                parent,
                resourceType,
              }
            )
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        catchUnhandledError('Error searching FHIR server'),
        Effect.map((response) => response.data)
      )
    }

    const create: (typeof FhirR4Client.Service)['create'] = ({
      type,
      resource,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.create(
              {
                parent,
                type,
                requestBody: resource as healthcare_v1.Schema$HttpBody,
              }
            )
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        catchUnhandledError('Error creating FHIR resource'),
        Effect.map((response) => response.data)
      )

    const update: (typeof FhirR4Client.Service)['update'] = ({
      id,
      type,
      resource,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.update(
              {
                name: buildFhirResourcePath(parent, type, id),
                requestBody: resource as healthcare_v1.Schema$HttpBody,
              }
            )
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType: type, id }),
        catchUnhandledError(`Error updating FHIR ${type}`),
        Effect.map((response) => response.data)
      )

    const deleteResource: (typeof FhirR4Client.Service)['delete'] = ({
      id,
      type,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.delete(
              {
                name: buildFhirResourcePath(parent, type, id),
              }
            )
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType: type, id }),
        catchUnhandledError(`Error deleting FHIR ${type}`),
        Effect.asVoid
      )

    const executeBundle: (typeof FhirR4Client.Service)['executeBundle'] = (
      bundle
    ) =>
      Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle(
              {
                parent: parent,
                requestBody: bundle as healthcare_v1.Schema$HttpBody,
              }
            )
          return toHttpResponse(response.data)
        },
        catch: (cause) => errorToHttpResponse(cause),
      }).pipe(
        Effect.flatMap(Effect.succeed),
        handleAuthErr,
        handleAuthzErr,
        catchUnhandledError('Error executing FHIR bundle'),
        Effect.map((response) => response.data)
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
