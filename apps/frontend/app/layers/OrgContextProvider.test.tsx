import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Either, Effect, Stream } from 'effect'
import { OrgContextProvider } from './OrgContextProvider'
import { usePlatformContext } from './PlatformContext'
import { OrgSlug, NoSelectedOrgError } from '@assessmentis/platform-domain'
import type { Org } from '@assessmentis/platform-domain'
import { createMockPlatformContext } from '../test-utils'

// Mock the PlatformContext
vi.mock('./PlatformContext', () => ({
  usePlatformContext: vi.fn(),
}))

describe('OrgContextProvider', () => {
  const mockOrg: Org = {
    slug: OrgSlug.make('test-org'),
    emoji: '🏥',
    frontendConfig: {
      fhirServer: {
        _tag: 'not_implemented' as const,
      },
      videoCallClient: {
        _tag: 'not_implemented' as const,
      },
    },
  }

  let mockSetActiveOrgSlug: Mock<() => Effect.Effect<undefined, never, never>>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockSetActiveOrgSlug = vi.fn(() => Effect.succeed(undefined))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show org picker when no org selected', async () => {
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(
          Either.left(new NoSelectedOrgError({}))
        ),
        activeOrg: Effect.succeed(null),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

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

    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(Either.left(mockError)),
        activeOrg: Effect.succeed(null),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

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
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(Either.right(mockOrg)),
        activeOrg: Effect.succeed(mockOrg),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

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

    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(
          Either.left(new NoSelectedOrgError({}))
        ),
        activeOrg: Effect.succeed(null),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
        setActiveOrgSlug: mockSetActiveOrgSlug,
      })
    )

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
      emoji: '🏢',
      frontendConfig: {
        fhirServer: { _tag: 'not_implemented' as const },
        videoCallClient: { _tag: 'not_implemented' as const },
      },
    }

    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(Either.right(unauthorizedOrg)),
        activeOrg: Effect.succeed(unauthorizedOrg),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

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
