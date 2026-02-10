import { FallbackProps } from 'react-error-boundary'
import { ErrorHandlerBody } from '../modules/common/components/ErrorHandlerBody'
import NavHeaderContainer, {
  TextHeader,
} from '../modules/global/components/NavHeader/NavHeader'
import { PlatformContext, usePlatformContext } from './PlatformContext'
import { useStream } from '@assessmentis/react-util'
import { Effect, Either, Scope, Stream } from 'effect'
import { useEffect, useMemo, useState } from 'react'
import {
  NoSelectedOrgError,
  Org,
  OrgSlug,
  User,
  UserId,
} from '@assessmentis/platform-domain'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

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
