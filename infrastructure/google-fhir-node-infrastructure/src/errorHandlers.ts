import { Effect } from 'effect'
import { HttpResponse, failOnHttpStatus, failOnHttpStatuses } from '@assessmentis/util'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { NotFoundError } from '@assessmentis/ontology'

/**
 * Handler for 401 Unauthorized errors
 */
export const handleAuthErr = failOnHttpStatus(401, (resp: HttpResponse) =>
  new AuthError({
    message: 'Unauthorized access to FHIR resource',
    cause: resp.statusText,
  })
)

/**
 * Handler for 403 Forbidden errors
 */
export const handleAuthzErr = failOnHttpStatus(403, (resp: HttpResponse) =>
  new AuthzError({
    message: 'Forbidden access to FHIR resource',
    cause: resp.statusText,
  })
)

/**
 * Handler for 404 Not Found and 410 Gone errors
 */
export const handleNotFoundErr = ({
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
