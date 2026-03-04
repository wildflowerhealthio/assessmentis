import { Either, type Scope, type Stream } from 'effect'
import React, { useEffect, useState, type JSX } from 'react'

import {
  AuthError,
  BadDataError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  NoSelectedOrgError,
  type Org,
  type OrgSlug,
  type User,
  type UserId,
} from '@assessmentis/platform-domain'
import { useStream } from '@assessmentis/react-util'

import { LoginButton } from '../../global/components/LoginButton'
import { Generic404Content } from './Generic404Content'

const useBestError = ({
  error,
  resetErrorBoundary,
  activeOrgStream,
  userStream,
}: {
  error: unknown
  resetErrorBoundary: () => void
  activeOrgStream: Stream.Stream<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
    >,
    never,
    Scope.Scope
  >
  userStream: Stream.Stream<
    Either.Either<
      User,
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'User', { userId: UserId }>
    >,
    never,
    Scope.Scope
  >
}) => {
  const userEitherPromise = useStream(userStream)
  const orgEitherPromise = useStream(activeOrgStream)
  const [overrideError, setOverrideError] = useState<unknown>(undefined)

  useEffect(() => {
    Promise.all([userEitherPromise, orgEitherPromise]).then(
      ([userEither, orgEither]) => {
        if (Either.isLeft(userEither) && error != userEither.left) {
          // Rethrow, if we don't have a user the ultimate problem is likely auth
          // related and we want to show the login screen, not the org picker
          setOverrideError(userEither.left)
          return
        }

        if (Either.isLeft(orgEither) && error != orgEither.left) {
          // Rethrow, if we have a user but no org the problem is likely org selection related
          // and we want to show the org picker, not the login screen
          setOverrideError(orgEither.left)
          return
        }

        if (Either.isRight(userEither) && error == AuthError.Unauthenticated) {
          resetErrorBoundary()
        } else if (
          Either.isRight(orgEither) &&
          error instanceof NoSelectedOrgError
        ) {
          resetErrorBoundary()
        }
      }
    )
  }, [userEitherPromise, orgEitherPromise, resetErrorBoundary, error])

  return overrideError ?? error
}

export const ErrorHandlerBody = ({
  error: caughtError,
  resetErrorBoundary,
  activeOrgStream,
  userStream,
}: {
  error: unknown
  resetErrorBoundary: () => void
  activeOrgStream: Stream.Stream<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
    >,
    never,
    Scope.Scope
  >
  userStream: Stream.Stream<
    Either.Either<
      User,
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'User', { userId: UserId }>
    >,
    never,
    Scope.Scope
  >
}) => {
  const error = useBestError({
    error: caughtError,
    resetErrorBoundary,
    userStream,
    activeOrgStream,
  })

  let errorContent: JSX.Element
  if (error instanceof AuthError) {
    errorContent = (
      <>
        <h1 style={{ textAlign: 'center' }}>Please log in</h1>
        <p style={{ textAlign: 'center' }}>
          You need to log in to access this page.
        </p>
        <LoginButton
          style={{ display: 'block', margin: '0 auto' }}
          className="element-button button-2"
          onLogin={() => resetErrorBoundary()}
        />
      </>
    )
  } else if (error instanceof ExternalAssertionError) {
    errorContent = (
      <>
        <h1 style={{ textAlign: 'center' }}>
          An External Service Did Something Unexpected
        </h1>
        <CatchallErrorActions
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      </>
    )
  } else if (error instanceof UnhandledError) {
    errorContent = (
      <>
        <h1 style={{ textAlign: 'center' }}>
          Something We Don't Explicitly Handle Happened
        </h1>
        <CatchallErrorActions
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      </>
    )
  } else if (error instanceof BadDataError) {
    errorContent = (
      <>
        <h1 style={{ textAlign: 'center' }}>
          Data is Incorrect - Contact Support
        </h1>
        <CatchallErrorActions
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      </>
    )
  } else if (error instanceof NotFoundError) {
    errorContent = <Generic404Content resourceType={error.resourceType} />
  } else {
    errorContent = (
      <>
        <h1 style={{ textAlign: 'center' }}>
          Something Very Unexpected Happened
        </h1>
        <CatchallErrorActions
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      </>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
      }}
    >
      {errorContent}
    </div>
  )
}

const CatchallErrorActions = ({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) => {
  return (
    <>
      <p style={{ textAlign: 'center' }}>Just try again?</p>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexDirection: 'row',
        }}
      >
        <button
          className="element-button button-2"
          style={{ display: 'block', margin: '0 auto' }}
          onClick={() => resetErrorBoundary()}
        >
          Try Again
        </button>
        <button
          className="element-button button-2"
          style={{ display: 'block', margin: '0 auto' }}
          onClick={() => window.location.reload()}
        >
          Hard Reload Page
        </button>
      </div>

      {/* Raw Data (for debugging) */}
      <details style={{ marginTop: 'var(--space-5)' }}>
        <summary className="heading-4">Details (for support)</summary>
        <pre
          style={{
            background: 'var(--color-background-secondary)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-2)',
            overflow: 'auto',
            maxWidth: 1024,
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(error, null, 2)}
        </pre>
      </details>
    </>
  )
}
