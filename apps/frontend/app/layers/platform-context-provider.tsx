import { FetchHttpClient, HttpClient } from '@effect/platform'
import type { Scope } from 'effect'
import { Effect, Either, Layer, Match, Schema } from 'effect'
import { Suspense } from 'react'
import { Await } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import { makeDailyCoOriginTypeUser } from '@assessmentis/daily-co-infrastructure'
import type { DailyCoProxyIdentifier } from '@assessmentis/daily-co-infrastructure'
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
  DocumentStore,
  UserOrg,
  createAuthDataPubSub,
  createOrgPubSub,
  createOrgSlugPubSub,
  createUserPubSub,
  mapOrgStreamToHubState,
  startOrgService,
  startUserService,
} from '@assessmentis/platform-domain'
import type {
  DocumentPath,
  NoSelectedOrgError,
  Org,
  OrgService,
  OrgSlug,
  UserId,
} from '@assessmentis/platform-domain'
import { useEffectTs } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { ErrorBoundary } from 'react-error-boundary'

import type { GoogleUserCredentialIdentifier } from '@assessmentis/google-account-infrastructure'
import { FirebaseWebLayer } from '../firebase-web-layer'
import { ErrorHandlerBody } from '../modules/common/components/error-handler-body'
import { PageLoader } from '../modules/common/components/PageLoader/page-loader'
import NavHeaderContainer, { TextHeader } from '../modules/global/components/NavHeader/nav-header'
import { makeCredentialService } from './credential-service'
import { PlatformlessErrorFallback } from './platform-aware-error-fallback'
import { PlatformContext } from './platform-context'

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
        documentStore.subscribeTo(['users', userId, 'orgs', slug] satisfies DocumentPath).pipe(
          StreamEither.mapEffect((data) =>
            Schema.decodeUnknown(UserOrg)(data).pipe(
              Effect.mapError(
                (parseError) =>
                  new UnhandledError({
                    cause: parseError,
                    message: 'Failed to decode UserOrg document',
                  })
              ),
              Effect.map((userOrg): UserOrg | undefined => userOrg)
            )
          ),
          StreamEither.catchTag(
            'NotFoundError',
            // oxlint-disable-next-line unicorn/no-useless-undefined -- Either.right requires a value argument
            () => Either.right<UserOrg | undefined>(undefined)
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
): StreamEither.StreamEither<Org, NoSelectedOrgError | UnhandledError, never, Scope.Scope> =>
  activeOrgStream.pipe(
    StreamEither.mapLeft(
      Match.typeTags<
        | NoSelectedOrgError
        | NotFoundError<'Org', { orgSlug: OrgSlug }>
        | BadDataError
        | UnhandledError
      >()({
        BadDataError: (e) => UnhandledError.fromUnknown(e),
        NoSelectedOrgError: (e) => e as NoSelectedOrgError | UnhandledError,
        NotFoundError: (e) => UnhandledError.fromUnknown(e),
        UnhandledError: (e) => e,
      })
    )
  )

// --- Platform effect ---

const platformEffect = Effect.gen(function* platformEffect() {
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
      getCredential: (id: GoogleUserCredentialIdentifier) => credentialService.get(id),
      healthcare,
      userId,
    }),
    makeDailyCoOriginTypeUser({
      getCredential: (id: DailyCoProxyIdentifier) => credentialService.get(id),
      httpClient,
    }),
  ] as const

  const userOrgStream = makeUserOrgStream(orgService.orgSlugStream, documentStore, userId)
  const activeOrgSnapshotStream = makeActiveOrgSnapshotStream(orgService.activeOrgStream)

  const combinedStream = StreamEither.zipLatestWith(
    activeOrgSnapshotStream,
    userOrgStream,
    (org, userOrg) => ({ org, userOrg })
  )

  const stateStream = mapOrgStreamToHubState(originTypes, combinedStream)
  const hub = yield* Hub.makeHub<ClinicalDomainClasses>(stateStream)

  return {
    authDataService,
    hub,
    orgService,
    userService,
  }
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      Layer.provideMerge(FirebaseWebDocumentStoreLayer, FirebaseWebLayer),
      Layer.provideMerge(LoadedGapiHealthcareClient.Default, LoadedGapiClient.Default),
      FetchHttpClient.layer
    )
  )
)

const LoaderPage = ({ title }: { title?: string }): React.JSX.Element => (
  <div
    style={{
      flexDirection: 'column',
      flexGrow: 1,
      flexShrink: 1,
      margin: '0 auto',
      overflowY: 'hidden',
      width: '100%',
    }}
  >
    <TextHeader title={title ?? 'Loading...'} />
    <PageLoader />
  </div>
)

export const PlatformContextProvider: React.FC<React.PropsWithChildren<object>> = ({
  children,
}) => {
  const platformPromise = useEffectTs(platformEffect)

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
