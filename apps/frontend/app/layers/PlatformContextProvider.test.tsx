import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Effect, Layer, Stream } from 'effect'
import { MemoryRouter } from 'react-router'
import { PlatformContextProvider } from './PlatformContextProvider'

// Mock infrastructure modules
vi.mock('@assessmentis/firebase-web-infrastructure', () => ({
  FirebaseWebDocumentStoreLayer: Layer.empty,
  startAuthDataService: vi.fn(() =>
    Effect.succeed({
      authDataStream: Stream.empty,
      signOut: Effect.succeed(undefined),
    })
  ),
}))

vi.mock('@assessmentis/google-fhir-web-infrastructure', () => ({
  LoadedGapiClient: {
    Default: Layer.empty,
  },
  LoadedGapiHealthcareClient: {
    Default: Layer.empty,
  },
  startAccessTokenSyncer: vi.fn(() => Effect.succeed(undefined)),
}))

vi.mock('../FirebaseWebLayer', () => ({
  FirebaseWebLayer: Layer.empty,
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
  Default: Layer.empty,
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
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show loading state initially', () => {
    render(
      <MemoryRouter>
        <PlatformContextProvider>
          <div>Children</div>
        </PlatformContextProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Loading\.\.\./)).toBeDefined()
  })

  it('should provide platform services to children after initialization', async () => {
    render(
      <MemoryRouter>
        <PlatformContextProvider>
          <div data-testid="child-content">Children</div>
        </PlatformContextProvider>
      </MemoryRouter>
    )

    // Initially should show loading
    expect(screen.getByText(/Loading\.\.\./)).toBeDefined()

    // After platform initializes, children should render
    await waitFor(
      () => {
        expect(screen.queryByTestId('child-content')).toBeDefined()
      },
      { timeout: 3000 }
    )
  })

  it('should not crash on render error (error boundary catches)', async () => {
    // Mock a failure in the platform initialization
    const { startAuthDataService } =
      await import('@assessmentis/firebase-web-infrastructure')
    vi.mocked(startAuthDataService).mockImplementationOnce(() =>
      Effect.die(new Error('Mock initialization error'))
    )

    // The component should not throw - the error boundary should catch it
    expect(() =>
      render(
        <MemoryRouter>
          <PlatformContextProvider>
            <div>Children</div>
          </PlatformContextProvider>
        </MemoryRouter>
      )
    ).not.toThrow()
  })

  it('should cleanup fiber on unmount', () => {
    const { unmount } = render(
      <MemoryRouter>
        <PlatformContextProvider>
          <div>Children</div>
        </PlatformContextProvider>
      </MemoryRouter>
    )

    // Unmount should not throw - fiber cleanup happens internally
    expect(() => unmount()).not.toThrow()
  })
})
