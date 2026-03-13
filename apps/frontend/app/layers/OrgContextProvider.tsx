import { Effect, Either } from 'effect'
import React, { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import {
  BadDataError,
  NotFoundError,
  UnhandledError,
  type AuthError,
} from '@assessmentis/ontology'
import { NoSelectedOrgError, type Org } from '@assessmentis/platform-domain'
import { useStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { ErrorBoundary } from 'react-error-boundary'

import { OrgContext } from './OrgContext'
import { usePlatformContext } from './PlatformContext'

export const OrgContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { orgService, userService } = usePlatformContext()

  const stream = useMemo(() => {
    return orgService.activeOrgStream.pipe(
      StreamEither.mapLeft((e) =>
        e instanceof NotFoundError ||
        e instanceof UnhandledError ||
        e instanceof BadDataError
          ? e.asUnhandledError()
          : e
      ),
      StreamEither.mapEffect((org) =>
        userService.user.pipe(
          Effect.mapError((e) =>
            e instanceof BadDataError || e instanceof NotFoundError
              ? e.asUnhandledError()
              : e
          ),
          Effect.flatMap((user) =>
            org != null && Object.keys(user.org_roles).includes(org.slug)
              ? Effect.succeed(org)
              : Effect.fail(new NoSelectedOrgError())
          )
        )
      )
    )
  }, [orgService.activeOrgStream, userService.user])

  const activeOrgPromise = useStream(stream)

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <h1>Error loading org picker {String(error)}</h1>
      )}
    >
      <Suspense fallback={<h1>Loading org picker...</h1>}>
        <Await resolve={activeOrgPromise}>
          {(orgOrErr) => (
            <OrgContextProviderContent orgOrErr={orgOrErr}>
              {children}
            </OrgContextProviderContent>
          )}
        </Await>
      </Suspense>
    </ErrorBoundary>
  )
}

const OrgContextProviderContent = ({
  children,
  orgOrErr,
}: React.PropsWithChildren<{
  orgOrErr: Either.Either<Org, NoSelectedOrgError | UnhandledError | AuthError>
}>) => {
  return orgOrErr.pipe(
    Either.match({
      onLeft(_err) {
        return <>You'll need to pick an organization</>
      },
      onRight(org) {
        return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
      },
    })
  )
}
