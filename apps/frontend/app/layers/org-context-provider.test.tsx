import { Effect, Either, Stream } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NoSelectedOrgError, OrgSlug } from '@assessmentis/platform-domain'
import type { Org } from '@assessmentis/platform-domain'

import { render, screen, waitFor } from '@testing-library/react'

import { createMockPlatformContext } from '../test-utils'
import { OrgContextProvider } from './org-context-provider'
import { usePlatformContext } from './platform-context'

// Mock the PlatformContext
vi.mock('./platform-context', () => ({
  usePlatformContext: vi.fn(),
}))

describe('OrgContextProvider', () => {
  const mockOrg: Org = {
    emoji: '🏥',
    originServerConfigs: {},
    origins: {},
    slug: OrgSlug.make('test-org'),
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
        activeOrg: Effect.succeed(null),
        activeOrgStream: Stream.succeed(Either.left(new NoSelectedOrgError())),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

    render(
      <OrgContextProvider>
        <div>Children</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("You'll need to pick an organization")).toBeDefined()
    })
  })

  it('should show message when org load fails with unrecognized error', async () => {
    const mockError = new Error('Failed to load org')

    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrg: Effect.succeed(null),
        activeOrgStream: Stream.succeed(Either.left(mockError)),
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
      expect(screen.getByText("You'll need to pick an organization")).toBeDefined()
    })
  })

  it('should render children when org is selected', async () => {
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrg: Effect.succeed(mockOrg),
        activeOrgStream: Stream.succeed(Either.right(mockOrg)),
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
      emoji: '🏢',
      originServerConfigs: {},
      origins: {},
      slug: OrgSlug.make('unauthorized-org'),
    }

    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({
        activeOrg: Effect.succeed(unauthorizedOrg),
        activeOrgStream: Stream.succeed(Either.right(unauthorizedOrg)),
        userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
      })
    )

    render(
      <OrgContextProvider>
        <div data-testid="child-content">Children Content</div>
      </OrgContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("You'll need to pick an organization")).toBeDefined()
    })

    // Children should not be rendered
    expect(screen.queryByTestId('child-content')).toBeNull()
  })
})
