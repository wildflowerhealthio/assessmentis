import { Cause } from 'effect'
import type { Response } from 'firebase-functions/v1'

import { AuthError, AuthzError, UnhandledError } from '@assessmentis/ontology'

/**
 * Handle errors and send appropriate response
 */

export const handleError = <HandleExplicitly, Should500 = never>(
  cause: Cause.Cause<
    NoInfer<AuthError | AuthzError | UnhandledError | Should500 | HandleExplicitly>
  >,
  response: Response,
  didHandle?: (error: unknown) => boolean
): void => {
  const error = Cause.squash(cause)
  if (didHandle && didHandle(error)) {
    return
  }
  if (error instanceof Cause.InterruptedException) {
    response.status(500).json({ error: String(error), message: 'Request was interrupted' })
  } else if (error instanceof AuthError) {
    response.status(401).json({ message: error.message })
  } else if (error instanceof AuthzError) {
    response.status(403).json({ message: error.message })
  } else if (error instanceof UnhandledError) {
    response.status(500).json({ message: error.message })
  } else {
    response.status(500).json({
      error: String(error),
      message: 'Internal server error',
    })
  }
}
