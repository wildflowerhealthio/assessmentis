import { Effect } from 'effect'
import {
  AuthError,
  AuthzError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { failIf } from '@assessmentis/util'

/**
 * A set of handlers to coerce FHIR responses of a given type into the right shape
 */
export interface FhirResponseHandlers<T, R extends T, S extends R> {
  handleReadResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    | AuthError
    | AuthzError
    | UnhandledError
    | NotFoundError<ResourceType, { id: string }>,
    never
  >
  handleSearchResponse: (
    response: R
  ) => Effect.Effect<S, AuthError | AuthzError | UnhandledError, never>
  handleCreateResponse: (
    response: R
  ) => Effect.Effect<S, AuthError | AuthzError | UnhandledError, never>
  handleUpdateResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    | AuthError
    | AuthzError
    | UnhandledError
    | NotFoundError<ResourceType, { id: string }>,
    never
  >
  handleDeleteResponse: <ResourceType extends string>(
    response: R,
    params: { resourceType: ResourceType; id: string }
  ) => Effect.Effect<
    S,
    | AuthError
    | AuthzError
    | UnhandledError
    | NotFoundError<ResourceType, { id: string }>,
    never
  >

  handleExecuteBundleResponse: (
    response: R
  ) => Effect.Effect<S, AuthError | AuthzError | UnhandledError, never>
}

/**
 * Creates response handlers for a given response type that implements HttpResponse
 */
export const createFhirResponseHandlers = <
  T,
  R extends T,
  S extends R,
>(request: {
  isNotFound: (resp: T) => boolean
  isUnauthorized: (resp: T) => boolean
  isUnauthenticated: (resp: T) => boolean
  isSuccess: (resp: T) => resp is S
  // etc
}): FhirResponseHandlers<T, R, S> => {
  const handleAuthErr = failIf(
    request.isUnauthenticated,
    (cause) =>
      new AuthError({
        message: 'Unauthorized access to FHIR resource',
        cause,
      })
  )

  const handleAuthzErr = failIf(
    request.isUnauthorized,
    (cause) =>
      new AuthzError({
        message: 'Forbidden access to FHIR resource',
        cause,
      })
  )

  const handleNotFoundErr = <ResourceType extends string>({
    resourceType,
    id,
  }: {
    resourceType: ResourceType
    id: string
  }) =>
    failIf(
      request.isNotFound,
      (cause) =>
        new NotFoundError({
          resourceType,
          params: { id },
          cause,
        })
    )

  const succeedOrUnhandled = Effect.flatMap((resp: T) =>
    request.isSuccess(resp)
      ? Effect.succeed(resp)
      : Effect.fail(
          new UnhandledError({
            message: `The FHIR response was not successful '${String(resp)}'`,
          })
        )
  )

  return {
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

    handleCreateResponse: (response: R) =>
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

    handleDeleteResponse: <ResourceType extends string>(
      response: R,
      { resourceType, id }: { resourceType: ResourceType; id: string }
    ) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        Effect.flatMap(handleNotFoundErr({ resourceType, id })),
        succeedOrUnhandled
      ),

    handleExecuteBundleResponse: (response: R) =>
      Effect.succeed(response).pipe(
        Effect.flatMap(handleAuthErr),
        Effect.flatMap(handleAuthzErr),
        succeedOrUnhandled
      ),
  }
}
