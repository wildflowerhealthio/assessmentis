/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Either, Stream } from 'effect'

import type { NoSelectedOrgError, Org } from '@assessmentis/platform-domain'
import { neverUsedMock } from '@assessmentis/testing-utils'

import type { PlatformContext } from './layers/PlatformContext'

/**
 * Creates a mock Hub with sensible defaults for testing.
 * Returns success cases for all methods by default.
 */
export function createMockHub(overrides: Partial<any> = {}): any {
  return {
    get: (_klass: any, _url: any) => Effect.succeed({}),
    subscribe: (_klass: any, _url: any) => Stream.succeed(Either.right({})),
    search: (_klass: any, _params?: any) => Effect.succeed([]),
    subscribeSearch: (_klass: any, _params?: any) =>
      Stream.succeed(Either.right([])),
    create: (_klass: any, resource: any, _origin?: any) =>
      Effect.succeed({ ...resource, url: 'http://example.com/test' }),
    createMany: (_klass: any, resources: any[], _origin?: any) =>
      Effect.succeed(
        resources.map((r) => ({ ...r, url: 'http://example.com/test' }))
      ),
    update: (_klass: any, resource: any) => Effect.succeed(resource),
    delete: (_klass: any, _url: any) => Effect.succeed(undefined),
    ...overrides,
  }
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
    activeOrgStream?: Stream.Stream<
      Either.Either<Org, Error | NoSelectedOrgError>
    >
    activeOrg?: Effect.Effect<Org | null>
    userOrgs?: Record<string, string>

    setActiveOrgSlug?: (...args: any[]) => Effect.Effect<void>
    hub?: any
  } = {}
): PlatformContext {
  const defaultSetActiveOrgSlug = () => Effect.succeed(undefined as void)

  return {
    authDataService: neverUsedMock('authDataService'),
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
    hub: overrides.hub ?? createMockHub(),
  }
}
