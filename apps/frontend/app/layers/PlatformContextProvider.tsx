import { Effect, Either, Layer, Schema, Scope, Stream } from 'effect'
import { FetchHttpClient, HttpClient } from '@effect/platform'
import { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
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
import { Loading, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import {
  AuthDataService,
  createAuthDataPubSub,
  createOrgPubSub,
  createOrgSlugPubSub,
  createUserPubSub,
  DocumentStore,
  hubStateStream,
  NoSelectedOrgError,
  startOrgService,
  startUserService,
  UserOrg,
  type DocumentPath,
  type Org,
  type OrgService,
  type OrgSlug,
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

const resourceKeys = [
  'Composition',
  'DiagnosticReport',
  'Encounter',
  'Location',
  'Media',
  'Observation',
  'Patient',
  'Practitioner',
  'Questionnaire',
  'QuestionnaireResponse',
] as const

// --- Extracted stream helpers ---

type UserOrgEither = Either.Either<UserOrg | undefined, UnhandledError>

const makeUserOrgStream = (
  orgSlugStream: (typeof OrgService.Service)['orgSlugStream'],
  documentStore: typeof DocumentStore.Service,
  userId: string
): Stream.Stream<UserOrgEither, never, Scope.Scope> =>
  orgSlugStream.pipe(
    Stream.flatMap(
      Either.match({
        onLeft: (err): Stream.Stream<UserOrgEither> =>
          err instanceof NoSelectedOrgError
            ? Stream.succeed(Either.right(undefined))
            : Stream.succeed(
                Either.left(
                  new UnhandledError({ message: String(err), cause: err })
                )
              ),
        onRight: (orgSlug): Stream.Stream<UserOrgEither> =>
          documentStore
            .subscribeTo([
              'users',
              userId,
              'orgs',
              orgSlug,
            ] satisfies DocumentPath)
            .pipe(
              Stream.map(
                Either.match({
                  onLeft: (err) =>
                    err instanceof NotFoundError
                      ? Either.right(undefined as UserOrg | undefined)
                      : Either.left(
                          err instanceof UnhandledError
                            ? err
                            : new UnhandledError({
                                message: String(err),
                                cause: err,
                              })
                        ),
                  onRight: (data) => {
                    const decoded = Schema.decodeUnknownEither(UserOrg)(data)
                    return Either.match(decoded, {
                      onLeft: (parseError) =>
                        Either.left(
                          new UnhandledError({
                            message: 'Failed to decode UserOrg document',
                            cause: parseError,
                          })
                        ),
                      onRight: (userOrg) =>
                        Either.right(userOrg as UserOrg | undefined),
                    })
                  },
                })
              )
            ),
      }),
      { switch: true }
    )
  )

type OrgEither = Either.Either<
  Org,
  Loading<{ orgSlug: OrgSlug }> | UnhandledError
>

const makeMappedOrgStream = (
  activeOrgStream: (typeof OrgService.Service)['activeOrgStream']
): Stream.Stream<OrgEither, never, Scope.Scope> =>
  activeOrgStream.pipe(
    Stream.map(
      Either.match({
        onLeft: (err): OrgEither =>
          err instanceof NoSelectedOrgError
            ? Either.left(new Loading({ entity: { orgSlug: '' as OrgSlug } }))
            : Either.left(
                err instanceof UnhandledError
                  ? err
                  : new UnhandledError({ message: String(err), cause: err })
              ),
        onRight: Either.right,
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
  ]

  const userOrgStream = makeUserOrgStream(
    orgService.orgSlugStream,
    documentStore,
    userId
  )
  const mappedOrgStream = makeMappedOrgStream(orgService.activeOrgStream)
  const combinedStream = StreamEither.zipLatestWith(
    mappedOrgStream,
    userOrgStream,
    (org, userOrg) => ({ org, userOrg })
  )

  const stateStream = hubStateStream(originTypes, combinedStream)
  const hub = yield* Hub.makeHub<ResourceDataTypes>(resourceKeys, stateStream)

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
