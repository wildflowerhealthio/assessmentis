/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Either } from 'effect'
import { Effect, Stream } from 'effect'
import type { Org, NoSelectedOrgError } from '@assessmentis/platform-domain'
import { neverUsedMock } from '@assessmentis/util'
import type { PlatformContext } from './layers/PlatformContext'

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
    fhirR4ClientService: neverUsedMock('fhirR4ClientService'),
    clinicalDataRepositoryService: neverUsedMock(
      'clinicalDataRepositoryService'
    ),
    VideoCallClientService: neverUsedMock('VideoCallClientService'),
  }
}
