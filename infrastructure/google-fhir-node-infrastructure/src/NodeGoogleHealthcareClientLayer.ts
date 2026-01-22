import { Effect, Layer } from 'effect'
import { healthcare_v1 } from '@googleapis/healthcare'
import { google } from 'googleapis'

import {
  FhirR4Client,
  buildFhirStoreParent,
  buildFhirResourcePath,
  HttpResponse,
  createFhirResponseHandlers,
} from '@assessmentis/fhir-client'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'

/**
 * Adapter to convert googleapis response to HttpResponse
 * Extracts actual HTTP status from response if available
 */
const toHttpResponse = <T>(response: {
  status?: number
  data: healthcare_v1.Schema$HttpBody
}): HttpResponse<T> => ({
  status: response.status ?? 200,
  data: response.data.data as T,
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
 * Converts unknown error to UnhandledError
 */
const toUnhandledError = (message: string) => (error: unknown) =>
  new UnhandledError({ message, cause: error })

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

    const handlers = createFhirResponseHandlers<HttpResponse>()

    const read: (typeof FhirR4Client.Service)['read'] = ({
      resourceType,
      id,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.read({
          name: buildFhirResourcePath(parent, resourceType, id),
        })
      ).pipe(
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleReadResponse(errorToHttpResponse(error), {
            resourceType,
            id,
          })
        ),
        Effect.flatMap((response) =>
          handlers.handleReadResponse(response, { resourceType, id })
        ),
        Effect.map((response) => response.data)
      )

    const search: (typeof FhirR4Client.Service)['search'] = (params) => {
      const { resourceType, ...searchParams } = params

      return Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.searchType(
          {
            parent,
            resourceType,
            ...(Object.keys(searchParams).length > 0 && {
              requestBody: {
                resourceType,
              },
            }),
          },
          Object.keys(searchParams).length > 0
            ? {
                params: searchParams,
              }
            : undefined
        )
      ).pipe(
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleSearchResponse(errorToHttpResponse(error))
        ),
        Effect.flatMap((response) => handlers.handleSearchResponse(response)),
        Effect.map((response) => response.data)
      )
    }

    const create: (typeof FhirR4Client.Service)['create'] = ({
      type,
      resource,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.create({
          parent,
          type,
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleCreateResponse(errorToHttpResponse(error))
        ),
        Effect.flatMap((response) => handlers.handleCreateResponse(response)),
        Effect.map((response) => response.data)
      )

    const update: (typeof FhirR4Client.Service)['update'] = ({
      id,
      type,
      resource,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.update({
          name: buildFhirResourcePath(parent, type, id),
          requestBody: resource as healthcare_v1.Schema$HttpBody,
        })
      ).pipe(
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleUpdateResponse(errorToHttpResponse(error), {
            resourceType: type,
            id,
          })
        ),
        Effect.flatMap((response) =>
          handlers.handleUpdateResponse(response, { resourceType: type, id })
        ),
        Effect.map((response) => response.data)
      )

    const deleteResource: (typeof FhirR4Client.Service)['delete'] = ({
      id,
      type,
    }) =>
      Effect.tryPromise(() =>
        healthcare.projects.locations.datasets.fhirStores.fhir.delete({
          name: buildFhirResourcePath(parent, type, id),
        })
      ).pipe(
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleDeleteResponse(errorToHttpResponse(error), {
            resourceType: type,
            id,
          })
        ),
        Effect.flatMap((response) =>
          handlers.handleDeleteResponse(response, { resourceType: type, id })
        ),
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
        Effect.map(toHttpResponse),
        Effect.catchAll((error) =>
          handlers.handleExecuteBundleResponse(errorToHttpResponse(error))
        ),
        Effect.flatMap((response) =>
          handlers.handleExecuteBundleResponse(response)
        ),
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
