import { Effect, Either, Layer, Match, Schema, Scope } from 'effect'
import { FetchHttpClient, HttpClient } from '@effect/platform'
import { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import { makeDailyCoOriginType } from '@assessmentis/daily-co-infrastructure'
import { Hub } from '@assessmentis/effectful-store'
import {
  FirebaseWebDocumentStoreLayer,
  startAuthDataService,
} from '@assessmentis/firebase-web-infrastructure'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  makeGoogleFhirOriginType,
} from '@assessmentis/google-fhir-web-infrastructure'
import type { BadDataError, NotFoundError } from '@assessmentis/ontology'
import { UnhandledError } from '@assessmentis/ontology'
import {
  AuthDataService,
  createAuthDataPubSub,
  createOrgPubSub,
  createOrgSlugPubSub,
  createUserPubSub,
  DocumentStore,
  mapOrgStreamToHubState,
  startOrgService,
  startUserService,
  UserOrg,
} from '@assessmentis/platform-domain'
import type {
  NoSelectedOrgError,
  DocumentPath,
  Org,
  OrgService,
  OrgSlug,
  UserId,
} from '@assessmentis/platform-domain'
import { useEffectTs } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { ErrorBoundary } from 'react-error-boundary'

import { FirebaseWebLayer } from '../FirebaseWebLayer'
import { ErrorHandlerBody } from '../modules/common/components/ErrorHandlerBody'
import { PageLoader } from '../modules/common/components/PageLoader/PageLoader'
import NavHeaderContainer, {
  TextHeader,
} from '../modules/global/components/NavHeader/NavHeader'
import { makeCredentialService } from './CredentialService'
import { PlatformlessErrorFallback } from './PlatformAwareErrorFallback'
import { PlatformContext } from './PlatformContext'

// --- Extracted stream helpers ---

/**
 * Subscribes to the UserOrg document for the current user and selected org.
 *
 * `UserOrg | undefined` because a user may not yet have a UserOrg document
 * for the selected org -- `NotFoundError` is mapped to `undefined` rather
 * than treated as a failure. `NoSelectedOrgError` passes through as a `Left`
 * for downstream handling by {@link mapOrgStreamToHubState}.
 */
const makeUserOrgStream = (
  orgSlugStream: (typeof OrgService.Service)['orgSlugStream'],
  documentStore: typeof DocumentStore.Service,
  userId: UserId
): StreamEither.StreamEither<
  UserOrg | undefined,
  NoSelectedOrgError | UnhandledError,
  never,
  Scope.Scope
> =>
  orgSlugStream.pipe(
    StreamEither.flatMap(
      (slug): StreamEither.StreamEither<UserOrg | undefined, UnhandledError> =>
        documentStore
          .subscribeTo(['users', userId, 'orgs', slug] satisfies DocumentPath)
          .pipe(
            StreamEither.mapEffect((data) =>
              Schema.decodeUnknown(UserOrg)(data).pipe(
                Effect.mapError(
                  (parseError) =>
                    new UnhandledError({
                      message: 'Failed to decode UserOrg document',
                      cause: parseError,
                    })
                ),
                Effect.map((userOrg): UserOrg | undefined => userOrg)
              )
            ),
            StreamEither.catchTag('NotFoundError', () =>
              Either.right<UserOrg | undefined>(undefined)
            )
          ),
      { switch: true }
    )
  )

/**
 * Maps the active org stream errors, wrapping unexpected errors as
 * `UnhandledError` while preserving `NoSelectedOrgError` for downstream
 * handling in {@link mapOrgStreamToHubState}.
 */
const makeActiveOrgSnapshotStream = (
  activeOrgStream: (typeof OrgService.Service)['activeOrgStream']
): StreamEither.StreamEither<
  Org,
  NoSelectedOrgError | UnhandledError,
  never,
  Scope.Scope
> =>
  activeOrgStream.pipe(
    StreamEither.mapLeft(
      Match.typeTags<
        | NoSelectedOrgError
        | NotFoundError<'Org', { orgSlug: OrgSlug }>
        | BadDataError
        | UnhandledError
      >()({
        NoSelectedOrgError: (e) => e as NoSelectedOrgError | UnhandledError,
        NotFoundError: (e) => UnhandledError.fromUnknown(e),
        BadDataError: (e) => UnhandledError.fromUnknown(e),
        UnhandledError: (e) => e,
      })
    )
  )

// --- Platform effect ---

const platformEffect = Effect.gen(function* () {
  const authDataPubSub = yield* createAuthDataPubSub
  const orgSlugPubsub = yield* createOrgSlugPubSub
  const orgPubSub = yield* createOrgPubSub
  const userPubSub = yield* createUserPubSub

  const authDataService = yield* startAuthDataService(authDataPubSub)
  const orgService = yield* startOrgService(orgSlugPubsub, orgPubSub)
  const userService = yield* startUserService(userPubSub).pipe(
    Effect.provideService(AuthDataService, authDataService)
  )

  const credentialService = yield* makeCredentialService.pipe(
    Effect.provideService(AuthDataService, authDataService)
  )

  const gapiClient = yield* yield* LoadedGapiClient
  const healthcare = yield* LoadedGapiHealthcareClient
  const httpClient = yield* HttpClient.HttpClient

  const authData = yield* authDataService.authData
  const { userId } = authData
  const documentStore = yield* DocumentStore

  const originTypes = [
    makeGoogleFhirOriginType({
      gapiClient,
      healthcare,
      userId,
      getCredential: (id) => credentialService.get(id),
    }),
    makeDailyCoOriginType({
      httpClient,
      getCredential: (id) => credentialService.get(id),
    }),
  ] as const

  const userOrgStream = makeUserOrgStream(
    orgService.orgSlugStream,
    documentStore,
    userId
  )
  const activeOrgSnapshotStream = makeActiveOrgSnapshotStream(
    orgService.activeOrgStream
  )

  const combinedStream = StreamEither.zipLatestWith(
    activeOrgSnapshotStream,
    userOrgStream,
    (org, userOrg) => ({ org, userOrg })
  )

  const stateStream = mapOrgStreamToHubState(originTypes, combinedStream)
  const hub = yield* Hub.makeHub<ClinicalDomainClasses>(stateStream)

  return {
    authDataService,
    orgService,
    userService,
    hub,
  }
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      Layer.provideMerge(FirebaseWebDocumentStoreLayer, FirebaseWebLayer),
      Layer.provideMerge(
        LoadedGapiHealthcareClient.Default,
        LoadedGapiClient.Default
      ),
      FetchHttpClient.layer
    )
  )
)

const LoaderPage = ({ title }: { title?: string }) => (
  <div
    style={{
      width: '100%',
      margin: '0 auto',
      flexGrow: 1,
      flexShrink: 1,
      flexDirection: 'column',
      overflowY: 'hidden',
    }}
  >
    <TextHeader title={title ?? 'Loading...'} />
    <PageLoader />
  </div>
)

export const PlatformContextProvider: React.FC<
  React.PropsWithChildren<object>
> = ({ children }) => {
  const thisPlatformEffect = useMemo(() => {
    const scope = Effect.runSync(Scope.make())
    return platformEffect.pipe(Effect.provideService(Scope.Scope, scope))
  }, [])

  const platformPromise = useEffectTs(thisPlatformEffect)

  if (typeof window === 'undefined') {
    return <LoaderPage title="Loading Without Window" />
  }

  return (
    <Suspense fallback={<LoaderPage />}>
      <ErrorBoundary FallbackComponent={PlatformlessErrorFallback}>
        <Await resolve={platformPromise}>
          {(platform) => (
            <PlatformContext.Provider value={platform}>
              <NavHeaderContainer
                activeOrgStream={platform.orgService.activeOrgStream}
                userStream={platform.userService.userStream}
                setActiveOrgSlug={platform.orgService.setActiveOrgSlug}
              />
              <ErrorBoundary
                fallbackRender={({ error, resetErrorBoundary }) => (
                  <ErrorHandlerBody
                    error={error}
                    resetErrorBoundary={resetErrorBoundary}
                    activeOrgStream={platform.orgService.activeOrgStream}
                    userStream={platform.userService.userStream}
                  />
                )}
              >
                {children}
              </ErrorBoundary>
            </PlatformContext.Provider>
          )}
        </Await>
      </ErrorBoundary>
    </Suspense>
  )
}
