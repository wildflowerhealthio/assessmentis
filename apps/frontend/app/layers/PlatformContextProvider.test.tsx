import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Effect, Layer, Stream } from 'effect'
import { PlatformContextProvider } from './PlatformContextProvider'

// Mock infrastructure modules
vi.mock('@assessmentis/firebase-web-infrastructure', () => ({
  FirebaseWebDocumentStoreLayer: Layer.succeed({}, {}),
  startAuthDataService: vi.fn(() =>
    Effect.succeed({
      authDataStream: Stream.empty,
      signOut: Effect.succeed(undefined),
    })
  ),
}))

vi.mock('@assessmentis/google-fhir-web-infrastructure', () => ({
  LoadedGapiClient: {
    Default: Layer.succeed({}, {}),
  },
  LoadedGapiHealthcareClient: {
    Default: Layer.succeed({}, {}),
  },
  startAccessTokenSyncer: vi.fn(() => Effect.succeed(undefined)),
}))

vi.mock('../FirebaseWebLayer', () => ({
  FirebaseWebLayer: Layer.succeed({}, {}),
}))

vi.mock('@assessmentis/platform-domain', () => ({
  AuthDataService: {
    Service: {},
  },
  createAuthDataPubSub: Effect.succeed({
    publish: vi.fn(),
    subscribe: vi.fn(),
  }),
  createOrgPubSub: Effect.succeed({
    publish: vi.fn(),
    subscribe: vi.fn(),
  }),
  createOrgSlugPubSub: Effect.succeed({
    publish: vi.fn(),
    subscribe: vi.fn(),
  }),
  createUserPubSub: Effect.succeed({
    publish: vi.fn(),
    subscribe: vi.fn(),
  }),
  startOrgService: vi.fn(() =>
    Effect.succeed({
      activeOrgStream: Stream.empty,
      activeOrg: Effect.succeed(null),
      setActiveOrgSlug: vi.fn(() => Effect.succeed(undefined)),
    })
  ),
  startUserService: vi.fn(() =>
    Effect.succeed({
      user: Effect.succeed({ org_roles: {} }),
    })
  ),
}))

vi.mock('./FhirR4ClientService', () => ({
  FhirR4ClientService: {
    Service: {},
  },
  createFhirR4ClientPubSub: Effect.succeed({
    publish: vi.fn(),
    subscribe: vi.fn(),
  }),
  startFhirR4ClientService: vi.fn(() =>
    Effect.succeed({
      client: {},
    })
  ),
}))

vi.mock('./ClinicalDataRepositoriesService', () => ({
  ClinicalDataRepositoryService: Effect.succeed({
    repository: {},
  }),
  Default: Layer.succeed({}, {}),
}))

vi.mock('./ExternalVideoCallClientService', () => ({
  startExternalVideoCallClientService: vi.fn(() =>
    Effect.succeed({
      client: {},
    })
  ),
}))

describe('PlatformContextProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    render(
      <PlatformContextProvider>
        <div>Children</div>
      </PlatformContextProvider>
    )

    expect(
      screen.getByText(/Loading PlatformContextProvider/)
    ).toBeDefined()
  })

  it('should provide platform services to children after initialization', async () => {
    render(
      <PlatformContextProvider>
        <div data-testid="child-content">Children</div>
      </PlatformContextProvider>
    )

    // Initially should show loading
    expect(
      screen.getByText(/Loading PlatformContextProvider/)
    ).toBeDefined()

    // After platform initializes, children should render
    await waitFor(
      () => {
        expect(screen.queryByTestId('child-content')).toBeDefined()
      },
      { timeout: 3000 }
    )
  })

  it('should render error boundary fallback on failure', async () => {
    // Mock a failure in the platform initialization
    const { startAuthDataService } = await import(
      '@assessmentis/firebase-web-infrastructure'
    )
    vi.mocked(startAuthDataService).mockImplementationOnce(() =>
      Effect.fail(new Error('Mock initialization error'))
    )

    render(
      <PlatformContextProvider>
        <div>Children</div>
      </PlatformContextProvider>
    )

    // Should show error message from error boundary
    await waitFor(
      () => {
        expect(screen.getByText(/Failed to load platform/)).toBeDefined()
      },
      { timeout: 3000 }
    )
  })

  it('should cleanup on unmount (AbortController)', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    const { unmount } = render(
      <PlatformContextProvider>
        <div>Children</div>
      </PlatformContextProvider>
    )

    unmount()

    expect(abortSpy).toHaveBeenCalled()

    abortSpy.mockRestore()
  })
})
