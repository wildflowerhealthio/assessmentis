import type { Effect, Scope } from 'effect'

import type {
  Origin,
  ReadonlyUrl,
  Resource,
} from '@assessmentis/effectful-store'

import type { BaseOriginDefinition } from './BaseOriginDefinition'

/**
 * Protocol for origin construction. Infrastructure packages implement this
 * interface to encapsulate decoding, credential resolution, and OriginState
 * building. The `tag` must match the `_tag` field on `BaseOriginDefinition`.
 *
 * The `originUrl` parameter is the canonical URL derived from the org's
 * origin registry key, so makers don't need to reconstruct it independently.
 *
 * Credential resolution is injected at construction time via a callback,
 * keeping the dependency direction correct (infrastructure → domain).
 */
export interface OriginFactory<
  Resources extends Resource.ResourceSet,
  R = never,
> {
  readonly tag: string
  readonly make: (
    originUrl: ReadonlyUrl,
    definition: BaseOriginDefinition,
    originConfig: Record<string, unknown> | undefined
  ) => Effect.Effect<Origin.AnyState<Resources, never>, never, R | Scope.Scope>
}
