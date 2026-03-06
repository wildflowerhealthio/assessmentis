import { Effect, Layer, Scope } from 'effect'
import { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import {
  FirebaseWebDocumentStoreLayer,
  startAuthDataService,
} from '@assessmentis/firebase-web-infrastructure'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  startAccessTokenSyncer,
} from '@assessmentis/google-fhir-web-infrastructure'
import {
  AuthDataService,
  createAuthDataPubSub,
  createOrgPubSub,
  createOrgSlugPubSub,
  createUserPubSub,
  startOrgService,
  startUserService,
} from '@assessmentis/platform-domain'
import { useEffectTs } from '@assessmentis/react-util'

import { ErrorBoundary } from 'react-error-boundary'

import { makeHub } from '../../../../global/effectful-store/src/Hub'
import { FirebaseWebLayer } from '../FirebaseWebLayer'
import { ErrorHandlerBody } from '../modules/common/components/ErrorHandlerBody'
import { PageLoader } from '../modules/common/components/PageLoader/PageLoader'
import NavHeaderContainer, {
  TextHeader,
} from '../modules/global/components/NavHeader/NavHeader'
import {
  createFhirR4ClientPubSub,
  startFhirR4ClientService,
} from './FhirR4ClientService'
import { PlatformlessErrorFallback } from './PlatformAwareErrorFallback'
import { PlatformContext } from './PlatformContext'

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
  const hub = yield* makeHub<ResourceDataTypes>([
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
  ])

  const fhirR4ClientService = yield* startFhirR4ClientService(
    fhirR4ClientPubSub,
    orgService.activeOrgStream,
    hub
  )

  return {
    authDataService,
    orgService,
    userService,
    fhirR4ClientService,
    hub,
  }
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      Layer.provideMerge(FirebaseWebDocumentStoreLayer, FirebaseWebLayer),
      Layer.provideMerge(
        LoadedGapiHealthcareClient.Default,
        LoadedGapiClient.Default
      )
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
