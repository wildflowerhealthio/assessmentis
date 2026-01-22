import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Either, Effect, Stream } from 'effect'
import { OrgContextProvider } from './OrgContextProvider'
import { usePlatformContext } from './PlatformContext'
import { OrgSlug } from '@assessmentis/platform-domain'
import type { Org } from '@assessmentis/platform-domain'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'

// Polyfill for Promise.withResolvers (Node < 22)
if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: any) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// Mock the PlatformContext
vi.mock('./PlatformContext', () => ({
  usePlatformContext: vi.fn(),
}))

describe('OrgContextProvider', () => {
  const mockOrg: Org = {
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: {
        _tag: 'not_implemented' as const,
      },
      videoCallClient: {
        _tag: 'not_implemented' as const,
      },
    },
  }

  const mockUserOrgs: ReadonlyArray<OrgSlug> = [
    OrgSlug.make('test-org'),
    OrgSlug.make('another-org'),
  ]

  let mockSetActiveOrgSlug: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockSetActiveOrgSlug = vi.fn(() => Effect.succeed(undefined))

    // Default mock implementation
    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream: Stream.empty,
        activeOrg: Effect.succeed(mockOrg),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: Effect.succeed({ org_roles: { 'test-org': 'admin' } }),
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })
  })

  it('should show org picker when no org selected', async () => {
    // Mock activeOrgStream to emit NoSelectedOrgError
    const activeOrgStream = Stream.succeed(
      Either.left(new NoSelectedOrgError({}))
    )

    // Mock user effect to return user with orgs
    const userEffect = Effect.succeed({
      org_roles: { 'test-org': 'admin', 'another-org': 'member' },
    })

    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream,
        activeOrg: Effect.succeed(null),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: userEffect,
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })

    render(
      <OrgContextProvider>
        <div>Children</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeDefined()
    })

    expect(screen.getByRole('combobox')).toBeDefined()
  })

  it('should show org picker with error when org load fails', async () => {
    const mockError = new Error('Failed to load org')

    // Mock activeOrgStream to emit error
    const activeOrgStream = Stream.succeed(Either.left(mockError))

    // Mock user effect to return user with orgs
    const userEffect = Effect.succeed({
      org_roles: { 'test-org': 'admin', 'another-org': 'member' },
    })

    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream,
        activeOrg: Effect.succeed(null),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: userEffect,
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })

    render(
      <OrgContextProvider>
        <div>Children</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeDefined()
    })

    // Should show the error message
    expect(screen.getByText(/Failed to load org/)).toBeDefined()
  })

  it('should render children when org is selected', async () => {
    // Mock activeOrgStream to emit successful org
    const activeOrgStream = Stream.succeed(Either.right(mockOrg))

    // Mock user effect to return user with orgs
    const userEffect = Effect.succeed({
      org_roles: { 'test-org': 'admin', 'another-org': 'member' },
    })

    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream,
        activeOrg: Effect.succeed(mockOrg),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: userEffect,
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })

    render(
      <OrgContextProvider>
        <div data-testid="child-content">Children Content</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeDefined()
    })

    expect(screen.getByText('Children Content')).toBeDefined()
  })

  it('should call setActiveOrgSlug when org is picked from selector', async () => {
    const user = userEvent.setup()

    // Mock activeOrgStream to emit NoSelectedOrgError initially
    const activeOrgStream = Stream.succeed(
      Either.left(new NoSelectedOrgError({}))
    )

    // Mock user effect to return user with orgs
    const userEffect = Effect.succeed({
      org_roles: { 'test-org': 'admin', 'another-org': 'member' },
    })

    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream,
        activeOrg: Effect.succeed(null),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: userEffect,
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })

    render(
      <OrgContextProvider>
        <div>Children</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeDefined()
    })

    const select = screen.getByRole('combobox')

    // Select an org
    await user.selectOptions(select, 'another-org')

    // Should have called setActiveOrgSlug
    await waitFor(() => {
      expect(mockSetActiveOrgSlug).toHaveBeenCalled()
    })
  })

  it('should not render children when org is not in user orgs', async () => {
    const unauthorizedOrg: Org = {
      slug: OrgSlug.make('unauthorized-org'),
      frontendConfig: {
        fhirServer: {
          _tag: 'not_implemented' as const,
        },
        videoCallClient: {
          _tag: 'not_implemented' as const,
        },
      },
    }

    // Mock activeOrgStream to emit org that user doesn't have access to
    const activeOrgStream = Stream.succeed(Either.right(unauthorizedOrg))

    // Mock user effect to return user with different orgs
    const userEffect = Effect.succeed({
      org_roles: { 'test-org': 'admin', 'another-org': 'member' },
    })

    vi.mocked(usePlatformContext).mockReturnValue({
      authDataService: {} as any,
      orgService: {
        activeOrgStream,
        activeOrg: Effect.succeed(unauthorizedOrg),
        setActiveOrgSlug: mockSetActiveOrgSlug,
      } as any,
      userService: {
        user: userEffect,
      } as any,
      fhirR4ClientService: {} as any,
      clinicalDataRepositoryService: {} as any,
      externalVideoCallClientService: {} as any,
    })

    render(
      <OrgContextProvider>
        <div data-testid="child-content">Children Content</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeDefined()
    })

    // Children should not be rendered
    expect(screen.queryByTestId('child-content')).toBeNull()
  })
})
