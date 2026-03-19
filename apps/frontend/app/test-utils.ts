/* oxlint-disable @typescript-eslint/no-explicit-any  typescript/no-unsafe-type-assertion */
import { Effect, Either, Stream } from 'effect'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Hub } from '@assessmentis/effectful-store'
import type { NoSelectedOrgError, Org } from '@assessmentis/platform-domain'
import { neverUsedMock } from '@assessmentis/testing-utils'

import type { PlatformContext } from './layers/platform-context'

type MockHub = Hub.Hub<ClinicalDomainClasses>
// Keys are checked (catches renames), but values are `any` since vi.fn() mocks
// Use simplified return types that don't match the full generic signatures.
type MockHubOverrides = Partial<Record<keyof Hub.Repository<ClinicalDomainClasses>, any>>

/**
 * Creates a mock Hub with sensible defaults for testing.
 * Returns success cases for all methods by default.
 */
export function createMockHub(overrides: MockHubOverrides = {}): MockHub {
  return {
    create: (_klass: any, resource: any, _origin?: any) =>
      Effect.succeed({ ...resource, url: 'http://example.com/test' }),
    createMany: (_klass: any, resources: any[], _origin?: any) =>
      Effect.succeed(resources.map((r) => ({ ...r, url: 'http://example.com/test' }))),
    delete: (_klass: any, _url: any) => Effect.void,
    get: (_klass: any, _url: any) => Effect.succeed({}),
    search: (_klass: any, _params?: any) => Effect.succeed([]),
    subscribe: (_klass: any, _url: any) => Stream.succeed(Either.right({})),
    subscribeSearch: (_klass: any, _params?: any) => Stream.succeed(Either.right([])),
    update: (_klass: any, resource: any) => Effect.succeed(resource),
    ...overrides,
  } as MockHub
}

/**
 * Creates a mock PlatformContext with sensible defaults.
 * Only specify the services you need to override for your test.
 *
 * @example
 * ```typescript
 * vi.mocked(usePlatformContext).mockReturnValue(
 *   createMockPlatformContext({
 *     activeOrgStream: Stream.succeed(Either.right(mockOrg)),
 *     activeOrg: Effect.succeed(mockOrg),
 *   })
 * )
 * ```
 */
export function createMockPlatformContext(
  overrides: {
    activeOrgStream?: Stream.Stream<Either.Either<Org, Error | NoSelectedOrgError>>
    activeOrg?: Effect.Effect<Org | null>
    userOrgs?: Record<string, string>

    setActiveOrgSlug?: (...args: any[]) => Effect.Effect<void>
    hub?: MockHub
  } = {}
): PlatformContext {
  const defaultSetActiveOrgSlug = (): Effect.Effect<void> => Effect.succeed(undefined as void)

  return {
    authDataService: neverUsedMock('authDataService'),
    hub: overrides.hub ?? createMockHub(),
    orgService: {
      activeOrgStream: overrides.activeOrgStream ?? Stream.empty,
      activeOrg: overrides.activeOrg ?? Effect.never,
      setActiveOrgSlug: overrides.setActiveOrgSlug ?? defaultSetActiveOrgSlug,
    } as any,
    userService: {
      user: Effect.succeed({
        org_roles: overrides.userOrgs ?? {},
      }),
    } as any,
  }
}
