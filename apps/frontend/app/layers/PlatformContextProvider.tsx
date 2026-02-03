import { Effect, Layer, Scope } from 'effect'
import { Suspense, useMemo } from 'react'
import { PlatformContext } from './PlatformContext'
import {
  FirebaseWebDocumentStoreLayer,
  startAuthDataService,
} from '@assessmentis/firebase-web-infrastructure'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  startAccessTokenSyncer,
} from '@assessmentis/google-fhir-web-infrastructure'
import { FirebaseWebLayer } from '../FirebaseWebLayer'
import {
  AuthDataService,
  createAuthDataPubSub,
  createOrgPubSub,
  createOrgSlugPubSub,
  createUserPubSub,
  startOrgService,
  startUserService,
} from '@assessmentis/platform-domain'
import {
  createFhirR4ClientPubSub,
  FhirR4ClientService,
  startFhirR4ClientService,
} from './FhirR4ClientService'
import { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'
import { startVideoCallClientService } from './VideoCallClientService'
import { Await, useAsyncError } from 'react-router'
import { useEffectTs } from '@assessmentis/react-util'
import NavHeader, {
  EmptyHeader,
  NavHeaderErrorHandler,
  TextHeader,
} from '../modules/global/components/NavHeader/NavHeader'
import { PageLoader } from '../modules/common/components/PageLoader/PageLoader'
import { InnerErrorHandlerPage } from '../modules/common/components/ErrorHandlerPage'
import { ErrorBoundary } from 'react-error-boundary'

const platformEffect = Effect.gen(function* () {
  const authDataPubSub = yield* createAuthDataPubSub
  const orgSlugPubsub = yield* createOrgSlugPubSub
  const orgPubSub = yield* createOrgPubSub
  const userPubSub = yield* createUserPubSub
  const fhirR4ClientPubSub = yield* createFhirR4ClientPubSub

  const authDataService = yield* startAuthDataService(authDataPubSub)
  const orgService = yield* startOrgService(orgSlugPubsub, orgPubSub)
  const userService = yield* startUserService(userPubSub).pipe(
    Effect.provideService(AuthDataService, authDataService)
  )
  yield* startAccessTokenSyncer(authDataService.authDataStream)

  const fhirR4ClientService = yield* startFhirR4ClientService(
    fhirR4ClientPubSub,
    orgService.activeOrgStream
  )

  const clinicalDataRepositoryService =
    yield* ClinicalDataRepositoryService.pipe(
      Effect.provide(
        ClinicalDataRepositoryService.Default.pipe(
          Layer.provide(Layer.succeed(FhirR4ClientService, fhirR4ClientService))
        )
      )
    )

  const VideoCallClientService = yield* startVideoCallClientService(
    authDataService,
    orgService.activeOrg
  )

  return {
    authDataService,
    orgService,
    userService,
    fhirR4ClientService,
    clinicalDataRepositoryService,
    VideoCallClientService,
  }
}).pipe(
  Effect.provide(FirebaseWebDocumentStoreLayer),
  Effect.provide(FirebaseWebLayer),
  Effect.provide(
    Layer.provideMerge(
      LoadedGapiHealthcareClient.Default,
      LoadedGapiClient.Default
    )
  )
)

const ErrorFallback = ({ error }: { error?: unknown }) => {
  const asyncError = useAsyncError()
  return (
    <div>
      <NavHeaderErrorHandler error={error ?? asyncError}>
        <EmptyHeader />
      </NavHeaderErrorHandler>
      <InnerErrorHandlerPage error={error ?? asyncError} />
    </div>
  )
}

export const PlatformContextProvider: React.FC<
  React.PropsWithChildren<object>
> = ({ children }) => {
  const thisPlatformEffect = useMemo(() => {
    const scope = Effect.runSync(Scope.make())
    return platformEffect.pipe(Effect.provideService(Scope.Scope, scope))
  }, [])
  const platformPromise = useEffectTs(thisPlatformEffect)

  if (typeof window === 'undefined') {
    return <TextHeader title="Loading..." />
  }

  return (
    <Suspense
      fallback={
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
          <TextHeader title="Loading..." />
          <PageLoader />
        </div>
      }
    >
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Await resolve={platformPromise} errorElement={<ErrorFallback />}>
          {(platform) => (
            <PlatformContext.Provider value={platform}>
              <NavHeader
                activeOrgStream={platform.orgService.activeOrgStream}
                userStream={platform.userService.userStream}
                setActiveOrgSlug={platform.orgService.setActiveOrgSlug}
              />
              {children}
            </PlatformContext.Provider>
          )}
        </Await>
      </ErrorBoundary>
    </Suspense>
  )
}
