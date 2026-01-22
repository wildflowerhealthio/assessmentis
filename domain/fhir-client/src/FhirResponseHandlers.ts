import { Effect } from 'effect'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { failUnless } from '@assessmentis/util'

/**
 * Generic HTTP response interface
 */
export interface HttpResponse<TData = unknown> {
  status: number
  statusText?: string
  data: TData
}

/**
 * A set of handlers to coerce FHIR responses of a given type into the right shape
 */
export interface FhirResponseHandlers<R> {
  handleReadResponse: (
    response: R,
    params: { resourceType: string; id: string }
  ) => Effect.Effect<
    R,
    AuthError | AuthzError | UnhandledError | NotFoundError,
    never
  >
  handleSearchResponse: (
    response: R
  ) => Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>
  handleCreateResponse: (
    response: R
  ) => Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>
  handleUpdateResponse: (
    response: R,
    params: { resourceType: string; id: string }
  ) => Effect.Effect<
    R,
    AuthError | AuthzError | UnhandledError | NotFoundError,
    never
  >
  handleDeleteResponse: (
    response: R,
    params: { resourceType: string; id: string }
  ) => Effect.Effect<
    R,
    AuthError | AuthzError | UnhandledError | NotFoundError,
    never
  >
  handleExecuteBundleResponse: (
    response: R
  ) => Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>
}

/**
 * Creates an error handler that fails when response status matches the given code
 */
const failOnHttpStatus = <TData, E>(
  statusCode: number,
  makeError: (resp: HttpResponse<TData>) => E
) =>
  Effect.flatMap((resp: HttpResponse<TData>) =>
    failUnless(
      (r: HttpResponse<TData>) => r.status !== statusCode,
      makeError
    )(resp)
  )

/**
 * Creates an error handler that fails when response status matches any of the given codes
 */
const failOnHttpStatuses = <TData, E>(
  statusCodes: readonly number[],
  makeError: (resp: HttpResponse<TData>) => E
) =>
  Effect.flatMap((resp: HttpResponse<TData>) =>
    failUnless(
      (r: HttpResponse<TData>) => !statusCodes.includes(r.status),
      makeError
    )(resp)
  )

/**
 * Creates response handlers for a given response type that implements HttpResponse
 */
export const createFhirResponseHandlers = <
  R extends HttpResponse,
>(): FhirResponseHandlers<R> => {
  const handleAuthErr = failOnHttpStatus(401, (resp: HttpResponse) =>
    new AuthError({
      message: 'Unauthorized access to FHIR resource',
      cause: resp.statusText,
    })
  )

  const handleAuthzErr = failOnHttpStatus(403, (resp: HttpResponse) =>
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
    failOnHttpStatuses([404, 410], (resp: HttpResponse) =>
      new NotFoundError({
        resourceType,
        params: { id },
        cause: resp,
      })
    )

  const catchUnhandledError = (message: string) =>
    Effect.catchAll((error: unknown) =>
      Effect.fail(
        new UnhandledError({
          message,
          cause: error,
        })
      )
    )

  return {
    handleReadResponse: (response, { resourceType, id }) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType, id })
      ) as Effect.Effect<
        R,
        AuthError | AuthzError | UnhandledError | NotFoundError,
        never
      >,

    handleSearchResponse: (response) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr
      ) as Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>,

    handleCreateResponse: (response) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr
      ) as Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>,

    handleUpdateResponse: (response, { resourceType, id }) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType, id })
      ) as Effect.Effect<
        R,
        AuthError | AuthzError | UnhandledError | NotFoundError,
        never
      >,

    handleDeleteResponse: (response, { resourceType, id }) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr,
        handleNotFoundErr({ resourceType, id })
      ) as Effect.Effect<
        R,
        AuthError | AuthzError | UnhandledError | NotFoundError,
        never
      >,

    handleExecuteBundleResponse: (response) =>
      Effect.succeed(response).pipe(
        handleAuthErr,
        handleAuthzErr
      ) as Effect.Effect<R, AuthError | AuthzError | UnhandledError, never>,
  }
}
