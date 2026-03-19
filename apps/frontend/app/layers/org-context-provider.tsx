import { Effect, Either } from 'effect'
import React, { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import { BadDataError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import type { AuthError } from '@assessmentis/ontology'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'
import type { Org } from '@assessmentis/platform-domain'
import { useStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { ErrorBoundary } from 'react-error-boundary'

import { OrgContext } from './org-context'
import { usePlatformContext } from './platform-context'

export const OrgContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { orgService, userService } = usePlatformContext()

  const stream = useMemo(
    () =>
      orgService.activeOrgStream.pipe(
        StreamEither.mapLeft((e) =>
          e instanceof NotFoundError || e instanceof UnhandledError || e instanceof BadDataError
            ? e.asUnhandledError()
            : e
        ),
        StreamEither.mapEffect((org) =>
          userService.user.pipe(
            Effect.mapError((e) =>
              e instanceof BadDataError || e instanceof NotFoundError ? e.asUnhandledError() : e
            ),
            Effect.flatMap((user) =>
              org !== null && org !== undefined && Object.keys(user.org_roles).includes(org.slug)
                ? Effect.succeed(org)
                : Effect.fail(new NoSelectedOrgError())
            )
          )
        )
      ),
    [orgService.activeOrgStream, userService.user]
  )

  const activeOrgPromise = useStream(stream)

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <h1>Error loading org picker {String(error)}</h1>}
    >
      <Suspense fallback={<h1>Loading org picker...</h1>}>
        <Await resolve={activeOrgPromise}>
          {(orgOrErr) => (
            <OrgContextProviderContent orgOrErr={orgOrErr}>{children}</OrgContextProviderContent>
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
}>): React.JSX.Element =>
  orgOrErr.pipe(
    Either.match({
      onLeft(_err) {
        return <>You&apos;ll need to pick an organization</>
      },
      onRight(org) {
        return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
      },
    })
  )
