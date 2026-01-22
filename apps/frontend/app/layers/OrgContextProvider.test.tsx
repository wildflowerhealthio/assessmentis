import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Either, Effect, Stream } from 'effect'
import { OrgContextProvider } from './OrgContextProvider'
import { usePlatformContext } from './PlatformContext'
import type { Org, OrgSlug } from '@assessmentis/platform-domain'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'

// Mock the PlatformContext
vi.mock('./PlatformContext', () => ({
  usePlatformContext: vi.fn(),
}))

// Mock react-util hooks
vi.mock('@assessmentis/react-util', () => ({
  useStream: vi.fn(),
  useEffectTs: vi.fn(),
}))

describe('OrgContextProvider', () => {
  const mockOrg: Org = {
    slug: 'test-org' as any,
    name: 'Test Organization',
    owner_uid: 'user-123',
    members: {},
  }

  const mockUserOrgs: ReadonlyArray<OrgSlug> = [
    'test-org' as any,
    'another-org' as any,
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
    const { useStream, useEffectTs } = await import('@assessmentis/react-util')

    // Mock to return NoSelectedOrgError
    vi.mocked(useStream).mockReturnValue(
      Promise.resolve(Either.left(new NoSelectedOrgError({})))
    )
    vi.mocked(useEffectTs).mockReturnValue(Promise.resolve(mockUserOrgs))

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
    const { useStream, useEffectTs } = await import('@assessmentis/react-util')

    const mockError = new Error('Failed to load org')

    // Mock to return error
    vi.mocked(useStream).mockReturnValue(
      Promise.resolve(Either.left(mockError))
    )
    vi.mocked(useEffectTs).mockReturnValue(Promise.resolve(mockUserOrgs))

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
    const { useStream, useEffectTs } = await import('@assessmentis/react-util')

    // Mock to return successful org
    vi.mocked(useStream).mockReturnValue(
      Promise.resolve(Either.right(mockOrg))
    )
    vi.mocked(useEffectTs).mockReturnValue(Promise.resolve(mockUserOrgs))

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
    const { useStream, useEffectTs } = await import('@assessmentis/react-util')
    const user = userEvent.setup()

    // Mock to return NoSelectedOrgError initially
    vi.mocked(useStream).mockReturnValue(
      Promise.resolve(Either.left(new NoSelectedOrgError({})))
    )
    vi.mocked(useEffectTs).mockReturnValue(Promise.resolve(mockUserOrgs))

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
    const { useStream, useEffectTs } = await import('@assessmentis/react-util')

    const unauthorizedOrg: Org = {
      slug: 'unauthorized-org' as any,
      name: 'Unauthorized Organization',
      owner_uid: 'user-123',
      members: {},
    }

    // Mock to return org that user doesn't have access to
    vi.mocked(useStream).mockReturnValue(
      Promise.resolve(Either.right(unauthorizedOrg))
    )
    vi.mocked(useEffectTs).mockReturnValue(Promise.resolve(mockUserOrgs))

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
