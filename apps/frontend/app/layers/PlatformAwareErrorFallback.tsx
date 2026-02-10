import { FallbackProps } from 'react-error-boundary'
import { ErrorHandlerBody } from '../modules/common/components/ErrorHandlerBody'
import { TextHeader } from '../modules/global/components/NavHeader/NavHeader'
import { Stream } from 'effect'

export const PlatformlessErrorFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
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
