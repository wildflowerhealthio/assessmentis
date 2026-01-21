import React, { useMemo, useCallback, Suspense } from 'react'
import { Either, Effect, Option, Stream } from 'effect'
import {
  AuthError,
  NoSelectedOrgError,
  Org,
  OrgSlug,
} from '@assessmentis/platform-domain'

import { OrgContext } from './OrgContext'
import { usePlatformContext } from './PlatformContext'
import { useEffectTs, useStream } from '@assessmentis/react-util'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { Await } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'

export const OrgContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { orgService, userService } = usePlatformContext()

  const stream = useMemo(() => {
    return orgService.activeOrgStream.pipe(
      Stream.tap((orgEither) =>
        Effect.sync(() => {
          console.log('Active org Gotten by stream:', orgEither)
        })
      )
    )
  }, [orgService.activeOrgStream])

  const activeOrgPromise = useStream(stream)

  const userOrgsEffect = useMemo(
    () =>
      Effect.map(userService.user, (user) =>
        Object.keys(user.org_roles).map((k) => OrgSlug.make(k))
      ),
    [userService.user]
  )
  const userOrgsPromise = useEffectTs(userOrgsEffect)

  const paramPromise = useMemo(() => {
    return Promise.all([activeOrgPromise, userOrgsPromise])
  }, [activeOrgPromise, userOrgsPromise])
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <h1>Error loading org picker {String(error)}</h1>
      )}
    >
      <Suspense fallback={<h1>Loading org picker...</h1>}>
        <Await resolve={paramPromise}>
          {([orgOrErr, userOrgs]) => (
            <OrgContextProviderContent orgOrErr={orgOrErr} userOrgs={userOrgs}>
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
  userOrgs,
  orgOrErr,
}: React.PropsWithChildren<{
  userOrgs: ReadonlyArray<OrgSlug>
  orgOrErr: Either.Either<
    Org,
    NoSelectedOrgError | NotFoundError | UnhandledError | AuthError
  >
}>) => {
  const { orgService } = usePlatformContext()

  const setPickedOrg = useCallback(
    (slug: string | null) => {
      const optionalSlug = Option.fromNullable(slug).pipe(
        Option.map(OrgSlug.make)
      )
      Effect.runPromiseExit(orgService.setActiveOrgSlug(optionalSlug)).then(
        (exit) => {
          console.log('Set active org slug exit:', exit)
        }
      )
    },
    [orgService]
  )

  return orgOrErr.pipe(
    Either.flatMap(
      (org): Either.Either<Org, NoSelectedOrgError> =>
        org != null && userOrgs.includes(org.slug)
          ? Either.right(org)
          : Either.left(new NoSelectedOrgError({}))
    ),
    Either.match({
      onLeft(err) {
        return (
          <div>
            <h2>Select Organization</h2>
            {err instanceof NoSelectedOrgError ? undefined : (
              <div style={{ color: 'red' }}>
                {String(err)}{' '}
                <pre style={{ textWrap: 'auto' }}>
                  {JSON.stringify(err, null, 2)}{' '}
                </pre>
              </div>
            )}
            <select value={''} onChange={(e) => setPickedOrg(e.target.value)}>
              <option value="" disabled>
                Select an organization
              </option>
              {userOrgs.map((orgSlug) => (
                <option key={orgSlug} value={orgSlug}>
                  {orgSlug}
                </option>
              ))}
            </select>
          </div>
        )
      },
      onRight(org) {
        return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
      },
    })
  )
}
