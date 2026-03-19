import { useAsyncError } from 'react-router'

import { NotFoundError } from '@assessmentis/ontology'

import { Generic404Content } from '../generic404-content'

/**
 * Error element for `<Await>` in resource detail routes.
 *
 * Shows {@link Generic404Content} for {@link NotFoundError}, otherwise
 * re-throws so the outer error boundary can handle it.
 */
export const ResourceAwaitError = (): React.JSX.Element => {
  const error = useAsyncError()

  if (error instanceof NotFoundError) {
    return <Generic404Content resourceType={error.resourceType} />
  }

  // Re-throw non-404 errors to the nearest error boundary
  throw error
}
