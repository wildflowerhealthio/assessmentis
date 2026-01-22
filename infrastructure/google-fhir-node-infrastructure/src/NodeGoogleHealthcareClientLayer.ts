import { Effect, Layer } from 'effect'
import { healthcare_v1 } from '@googleapis/healthcare'
import { google } from 'googleapis'

import { FhirR4Client, buildFhirStoreParent, buildFhirResourcePath } from '@assessmentis/fhir-client'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { HttpResponse } from '@assessmentis/util'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import { handleAuthErr, handleAuthzErr, handleNotFoundErr } from './errorHandlers'

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
          return toHttpResponse(response)
        },
        catch: (error) => {
          // googleapis throws errors for non-2xx responses
          // Extract status from error and create HttpResponse
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(
            handleAuthErr,
            handleAuthzErr,
            handleNotFoundErr({ resourceType, id })
          )
        ),
        catchUnhandledError('Error reading FHIR resource'),
        Effect.map((response) => response.data)
      )

    const search: (typeof FhirR4Client.Service)['search'] = (params) => {
      const { resourceType, ...searchParams } = params

      return Effect.tryPromise({
        try: async () => {
          const response =
            await healthcare.projects.locations.datasets.fhirStores.fhir.searchType(
              {
                parent,
                resourceType,
                // Pass search parameters as query params
                ...(Object.keys(searchParams).length > 0 && {
                  requestBody: {
                    resourceType,
                  },
                }),
              },
              // Add search parameters to the request config
              Object.keys(searchParams).length > 0
                ? {
                    params: searchParams,
                  }
                : undefined
            )
          return toHttpResponse(response)
        },
        catch: (error) => {
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(handleAuthErr, handleAuthzErr)
        ),
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
          return toHttpResponse(response)
        },
        catch: (error) => {
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(handleAuthErr, handleAuthzErr)
        ),
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
          return toHttpResponse(response)
        },
        catch: (error) => {
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(
            handleAuthErr,
            handleAuthzErr,
            handleNotFoundErr({ resourceType: type, id })
          )
        ),
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
          return toHttpResponse(response)
        },
        catch: (error) => {
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(
            handleAuthErr,
            handleAuthzErr,
            handleNotFoundErr({ resourceType: type, id })
          )
        ),
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
                parent,
                requestBody: bundle as healthcare_v1.Schema$HttpBody,
              }
            )
          return toHttpResponse(response)
        },
        catch: (error) => {
          const status =
            error &&
            typeof error === 'object' &&
            'code' in error &&
            typeof error.code === 'number'
              ? error.code
              : 500

          return {
            status,
            statusText: error instanceof Error ? error.message : String(error),
            data: error,
          } as HttpResponse
        },
      }).pipe(
        Effect.flatMap((response) =>
          Effect.succeed(response).pipe(handleAuthErr, handleAuthzErr)
        ),
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
