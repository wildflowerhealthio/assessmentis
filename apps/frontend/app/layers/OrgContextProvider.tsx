import React, { useMemo, Suspense } from 'react'
import { Either, Effect, Stream } from 'effect'
import { NoSelectedOrgError, Org } from '@assessmentis/platform-domain'

import { OrgContext } from './OrgContext'
import { usePlatformContext } from './PlatformContext'
import { useStream } from '@assessmentis/react-util'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { Await } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'

export const OrgContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { orgService, userService } = usePlatformContext()

  const stream = useMemo(() => {
    return orgService.activeOrgStream.pipe(
      Stream.map(
        Either.mapLeft((e) =>
          e instanceof NotFoundError ||
          e instanceof UnhandledError ||
          e instanceof BadDataError
            ? e.asUnhandledError()
            : e
        )
      ),
      Stream.mapEffect((orgEither) =>
        userService.user.pipe(
          Effect.mapError((e) =>
            e instanceof BadDataError || e instanceof NotFoundError
              ? e.asUnhandledError()
              : e
          ),
          Effect.either,
          Effect.map((user) =>
            Either.flatMap(user, (user) =>
              Either.flatMap(orgEither, (org) =>
                org != null && Object.keys(user.org_roles).includes(org.slug)
                  ? Either.right(org)
                  : Either.left(new NoSelectedOrgError({}))
              )
            )
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
