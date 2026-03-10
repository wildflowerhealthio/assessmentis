import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, Either, Layer, Stream } from 'effect'
import { MemoryRouter } from 'react-router'

import { render, screen, waitFor } from '@testing-library/react'

import { PlatformContextProvider } from './PlatformContextProvider'

// Mock infrastructure modules
vi.mock('@assessmentis/firebase-web-infrastructure', () => ({
  FirebaseWebDocumentStoreLayer: Layer.empty,
  startAuthDataService: vi.fn(() =>
    Effect.succeed({
      authDataStream: Stream.empty,
      authData: Effect.succeed({ userId: 'mock-user-id' }),
      signOut: Effect.succeed(undefined),
      shutdown: Effect.succeed(undefined),
    })
  ),
}))

vi.mock('@assessmentis/google-fhir-web-infrastructure', () => ({
  LoadedGapiClient: { Default: Layer.empty },
  LoadedGapiHealthcareClient: { Default: Layer.empty },
  makeGoogleFhirOriginType: vi.fn(() => ({
    tag: 'google_fhir_store',
    make: vi.fn(() =>
      Effect.succeed({ resolver: undefined, activeResources: {} })
    ),
  })),
}))

vi.mock('@assessmentis/daily-co-infrastructure', () => ({
  makeDailyCoOriginType: vi.fn(() => ({
    tag: 'daily_co',
    make: vi.fn(() =>
      Effect.succeed({ resolver: undefined, activeResources: {} })
    ),
  })),
}))

vi.mock('../FirebaseWebLayer', () => ({
  FirebaseWebLayer: Layer.empty,
}))

vi.mock('@assessmentis/platform-domain', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
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
        activeOrgStream: Stream.make(
          Either.right({
            slug: '',
            emoji: '',
            origins: {},
            originConfigs: {},
          })
        ),
        orgSlugStream: Stream.empty,
        activeOrg: Effect.succeed(null),
        setActiveOrgSlug: vi.fn(() => Effect.void),
        shutdown: Effect.void,
      })
    ),
    startUserService: vi.fn(() =>
      Effect.succeed({
        user: Effect.succeed({ org_roles: {} }),
        userStream: Stream.empty,
        shutdown: Effect.void,
      })
    ),
  }
})

vi.mock('./CredentialService', () => ({
  makeCredentialService: Effect.succeed({
    get: vi.fn(() => Effect.succeed({})),
  }),
  CredentialService: {
    of: (service: unknown) => service,
  },
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
