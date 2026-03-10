# Error Mapping Reference

This reference describes the canonical error taxonomy and how to map errors across layers.

## Canonical error types

- UnhandledError — unexpected failures with no specific handling.
- ExternalAssertionError — external systems returning data that violates expectations.
- BadDataError — internally controlled data violates schema or invariants.
- NotFoundError — requested resource not found.
- AuthError — authentication required or invalid.
- AuthzError — authenticated but insufficient permissions.

## Quick decision guide

- External response shape is wrong or missing fields → ExternalAssertionError.
- Internal persisted data violates schema/invariants → BadDataError.
- Resource lookup misses → NotFoundError.
- Missing or invalid auth token → AuthError.
- Authenticated but role/permission check fails → AuthzError.
- Everything else you did not anticipate → UnhandledError.

## Mapping rules by layer

### Domain

- Prefer explicit error unions on Effect return types.
- Use BadDataError for schema violations in persisted or domain-owned data.
- Avoid throwing raw Error; return typed errors.

### Infrastructure

- Convert SDK/network/HTTP errors to ExternalAssertionError when responses violate expectations.
- Convert auth/permission failures to AuthError or AuthzError.
- Convert missing records to NotFoundError.
- Only emit UnhandledError for truly unknown failures.

### Apps (frontend/backend)

- Normalize non-actionable errors to UnhandledError at UI boundaries.
- Preserve AuthError/AuthzError when the UI can react (sign-in or permissions messaging).
- Avoid leaking raw SDK errors into components.

## Conversion helpers

- Use asUnhandledError on ExternalAssertionError, BadDataError, NotFoundError, AuthError, and AuthzError when crossing UI boundaries.
- Prefer mapping inside Effect/Stream pipelines so downstream components see normalized errors.
- Do not introduce new error types unless a clear taxonomy gap exists.

## Most-used code locations

- Canonical error definitions: [src/errors.ts](src/errors.ts)
- Stream error normalization: [../../apps/frontend/app/layers/OrgContextProvider.tsx](../../apps/frontend/app/layers/OrgContextProvider.tsx)
- Hub access hook: [../../apps/frontend/app/layers/useHub.ts](../../apps/frontend/app/layers/useHub.ts)
- Hub Tag (domain): [../../domain/clinical-domain/src/ClinicalDomainHub.ts](../../domain/clinical-domain/src/ClinicalDomainHub.ts)
- Domain-level mapping example: [../../domain/platform-domain/src/services/LoadedUser.ts](../../domain/platform-domain/src/services/LoadedUser.ts)
