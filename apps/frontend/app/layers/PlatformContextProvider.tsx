import { Effect, Layer, Scope } from 'effect'
import { Suspense, useEffect, useRef, useState } from 'react'
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
import { startExternalVideoCallClientService } from './ExternalVideoCallClientService'
import { ErrorBoundary } from 'react-error-boundary'
import { Await } from 'react-router'

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

  const externalVideoCallClientService =
    yield* startExternalVideoCallClientService(
      authDataService,
      orgService.activeOrg
    )

  return {
    authDataService,
    orgService,
    userService,
    fhirR4ClientService,
    clinicalDataRepositoryService,
    externalVideoCallClientService,
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

export const PlatformContextProvider: React.FC<
  React.PropsWithChildren<object>
> = ({ children }) => {
  const startedRef = useRef(false)
  const [platformPromise, setPlatformPromise] = useState<
    Promise<PlatformContext>
  >(new Promise<PlatformContext>(() => {}))

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const scope = Effect.runSync(Scope.make())
    const controller = new AbortController()
    const signal = controller.signal
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatformPromise(
      Effect.runPromise(
        platformEffect.pipe(Effect.provideService(Scope.Scope, scope)),
        { signal }
      )
    )
    return () => controller.abort()
  }, [])

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div>Failed to load platform: {String(error)}</div>
      )}
    >
      <Suspense fallback={<div>Loading PlatformContextProvider...</div>}>
        <Await resolve={platformPromise}>
          {(platform) => (
            <PlatformContext.Provider value={platform}>
              {children}
            </PlatformContext.Provider>
          )}
        </Await>
      </Suspense>
    </ErrorBoundary>
  )
}
