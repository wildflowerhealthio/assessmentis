import type { Effect, Scope } from 'effect'

import type {
  OriginState,
  ResourcesConstraint,
} from '@assessmentis/effectful-store'

import type { BaseOriginDefinition } from './BaseOriginDefinition'

/**
 * Protocol for origin construction. Infrastructure packages implement this
 * interface to encapsulate decoding, credential resolution, and OriginState
 * building. The `tag` must match the `_tag` field on `BaseOriginDefinition`.
 *
 * Credential resolution is injected at construction time via a callback,
 * keeping the dependency direction correct (infrastructure → domain).
 */
export interface OriginType<Resources extends ResourcesConstraint, R = never> {
  readonly tag: string
  readonly make: (
    definition: BaseOriginDefinition,
    originConfig: Record<string, unknown> | undefined
  ) => Effect.Effect<OriginState<Resources, never>, never, R | Scope.Scope>
}
