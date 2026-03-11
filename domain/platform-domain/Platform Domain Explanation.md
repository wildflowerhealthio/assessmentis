---
title: Platform Services Explanation
category: Explanations
---

How authentication, authorization, and organization context work in `platform-domain`. For the broader architecture, see [Architecture Explanation](../../docs/Architecture/Explanation.md).

## Auth vs Authz Errors

`platform-domain/errors.ts` defines two distinct error types:

- **`AuthError`** — user is not authenticated (no valid session)
- **`AuthzError`** — user is authenticated but lacks required permissions

These are kept separate so boundaries can handle them differently (redirect to login vs show forbidden).

## Context Tag Classes

`platform-domain/tagClasses/` defines Effect Tags that carry runtime context:

| Tag               | Provides                       | Set by                                 |
| ----------------- | ------------------------------ | -------------------------------------- |
| `AuthDataService` | Authentication state stream    | PlatformContextProvider                |
| `CurrentUserId`   | Authenticated user's ID        | Auth middleware                        |
| `CurrentOrg`      | Selected organization          | OrgContextProvider                     |
| `DocumentStore`   | Document read/write operations | Platform layer (Firebase Web or Admin) |

## Hosted Services

Client-side reactive services in `platform-domain/hostedServices/`:

- **`OrgService`** — manages organization selection, emits org changes via `PubSub` + `Stream`
- **`UserService`** — manages user data and role information reactively

These are initialized by `PlatformContextProvider` and subscribe to `AuthDataService` for auth state changes.

## LoadedOrg / LoadedUser

`platform-domain/services/` defines server-side context:

- **`LoadedOrg`** — Effect Tag carrying the resolved organization instance
- **`LoadedUser`** — Effect Tag carrying the resolved user instance

These are provided as Layers in Cloud Functions after auth validation, enabling domain code to access the current org/user without passing them as parameters.

## Role-Based Authorization

`OrgUserService` checks user permissions within an organization:

```typescript
const program = Effect.gen(function* () {
  const orgUserService = yield* OrgUserService
  yield* orgUserService.requireRole('admin') // Fails with AuthzError if not admin
})
```

Roles are defined per-org in `OrgRole` mappings.

## See Also

- [Architecture Explanation](../../docs/Architecture/Explanation.md) — Two-level context hierarchy
- [Effect Patterns Reference](../../docs/Effect/Patterns%20Reference.md) — Repository and Layer patterns
