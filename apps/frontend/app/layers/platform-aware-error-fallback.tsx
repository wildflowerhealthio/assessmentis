import { Stream } from 'effect'

import type { FallbackProps } from 'react-error-boundary'

import { ErrorHandlerBody } from '../modules/common/components/error-handler-body'
import { TextHeader } from '../modules/global/components/NavHeader/nav-header'

export const PlatformlessErrorFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps): React.JSX.Element => {
  const userStream = Stream.never
  const activeOrgStream = Stream.never

  return (
    <div>
      <TextHeader
        title={`Platform Error - ${error instanceof Error ? error.message : String(error)}`}
        onClick={resetErrorBoundary}
      />
      <ErrorHandlerBody
        error={error}
        resetErrorBoundary={resetErrorBoundary}
        activeOrgStream={activeOrgStream}
        userStream={userStream}
      />
    </div>
  )
}
