import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, Either, Stream } from 'effect'

import {
  NoSelectedOrgError,
  OrgSlug,
  type Org,
} from '@assessmentis/platform-domain'

import { render, screen, waitFor } from '@testing-library/react'

import { createMockPlatformContext } from '../test-utils'
import { OrgContextProvider } from './OrgContextProvider'
import { usePlatformContext } from './PlatformContext'

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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show message when no org selected', async () => {
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrgStream: Stream.succeed(Either.left(new NoSelectedOrgError())),
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
      expect(
        screen.getByText("You'll need to pick an organization")
      ).toBeDefined()
    })
  })

  it('should show message when org load fails with unrecognized error', async () => {
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

    // Should show the message to pick an organization (since the error causes a left)
    await waitFor(() => {
      expect(
        screen.getByText("You'll need to pick an organization")
      ).toBeDefined()
    })
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
      expect(
        screen.getByText("You'll need to pick an organization")
      ).toBeDefined()
    })

    // Children should not be rendered
    expect(screen.queryByTestId('child-content')).toBeNull()
  })
})
