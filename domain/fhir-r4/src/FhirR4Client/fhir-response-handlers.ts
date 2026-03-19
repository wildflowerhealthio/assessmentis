import { Effect } from 'effect'

import { AuthError, AuthzError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { safeDebugString } from '@assessmentis/util'

/**
 * A set of handlers to coerce FHIR responses of a given type into the right shape
 */
export interface FhirResponseHandlers<T, R extends T, S extends R> {
  handleReadResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >
  handleSearchResponse: (response: R) => Effect.Effect<S, AuthError | AuthzError | UnhandledError>
  handleCreateResponse: (response: R) => Effect.Effect<S, AuthError | AuthzError | UnhandledError>
  handleUpdateResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >
  handleDeleteResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >

  handleExecuteBundleResponse: (
    response: R
  ) => Effect.Effect<S, AuthError | AuthzError | UnhandledError>
}

/**
 * Creates response handlers for a given response type that implements HttpResponse
 */
export const createFhirResponseHandlers = <T, R extends T, S extends R>(request: {
  isNotFound: (resp: T) => boolean
  isUnauthorized: (resp: T) => boolean
  isUnauthenticated: (resp: T) => boolean
  isSuccess: (resp: T) => resp is S
  // Etc
}): FhirResponseHandlers<T, R, S> => {
  const handleAuthErr = Effect.liftPredicate(
    (resp: T) => !request.isUnauthenticated(resp),
    (cause) =>
      new AuthError({
        cause,
        message: 'Unauthorized access to FHIR resource',
      })
  )

  const handleAuthzErr = Effect.liftPredicate(
    (resp: T) => !request.isUnauthorized(resp),
    (cause) =>
      new AuthzError({
        cause,
        message: 'Forbidden access to FHIR resource',
      })
  )

  const handleNotFoundErr = <ResourceType extends string>({
    resourceType,
    id,
  }: {
    resourceType: ResourceType
    id: string
  }): ((t: T) => Effect.Effect<T, NotFoundError<ResourceType, { id: string }>>) => {
    return Effect.liftPredicate(
      (resp: T) => !request.isNotFound(resp),
      (cause) =>
        new NotFoundError({
          cause,
          params: { id },
          resourceType,
        })
    )
  }

  const succeedOrUnhandled = Effect.flatMap((resp: T) => {
    if (request.isSuccess(resp)) {
      return Effect.succeed(resp)
    }
    return Effect.fail(
      new UnhandledError({
        message: `The FHIR response was not successful '${safeDebugString(resp)}'`,
      })
    )
  })

  return {
    handleCreateResponse: (response: R) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        succeedOrUnhandled
      ),

    handleDeleteResponse: <ResourceType extends string>(
      response: R,
      { resourceType, id }: { resourceType: ResourceType; id: string }
    ) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        Effect.flatMap((eff) => handleNotFoundErr({ resourceType, id })(eff)),
        succeedOrUnhandled
      ),

    handleExecuteBundleResponse: (response: R) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        succeedOrUnhandled
      ),

    handleReadResponse: <ResourceType extends string>(
      response: R,
      { resourceType, id }: { resourceType: ResourceType; id: string }
    ) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        Effect.flatMap(handleNotFoundErr({ resourceType, id })),
        succeedOrUnhandled
      ),

    handleSearchResponse: (response: R) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        succeedOrUnhandled
      ),

    handleUpdateResponse: <ResourceType extends string>(
      response: R,
      { resourceType, id }: { resourceType: ResourceType; id: string }
    ) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        Effect.flatMap(handleNotFoundErr({ resourceType, id })),
        succeedOrUnhandled
      ),
  }
}
