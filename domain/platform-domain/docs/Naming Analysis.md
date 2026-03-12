# Naming Analysis — platform-domain

Research-only analysis of five naming inconsistencies in `domain/platform-domain`.

---

## 1. `activeResources` (BaseOriginDefinition) vs `supportedResources` (effectful-store Origin)

**What they represent:** Both are `Record<string, boolean>` maps keyed by FHIR resource type name. They describe the same concept: which resource types a given origin can serve. The bridge is explicit in `HubStateUpdater.ts:102`: `supportedResources: def.activeResources`.

**Why problematic:** Two names for the same data forces readers to mentally confirm equivalence. A new contributor might assume "active" is an enabled subset of "supported."

| Name | Pros | Cons |
|---|---|---|
| **`supportedResources`** (align to effectful-store) | Already used in the larger, more public API. "Supported" is the standard FHIR capability term. | Requires Firestore field rename or Schema transform. |
| **`activeResources`** (align to platform-domain) | No Firestore migration. "Active" conveys admin intent. | Less standard; effectful-store is more widely consumed. |
| **`enabledResources`** | Neutral third option. | Changes on both sides. |

**Recommendation: `supportedResources`** — align the persisted schema to the runtime name via a Schema rename transform.

---

## 2. `originConfig` (UserOrg, singular) vs `originConfigs` (Org, plural)

**What they represent:** Both are `Record<UriEncodedOriginUrl, ...>` maps. `UserOrg.originConfig` holds per-user per-origin settings; `Org.originConfigs` holds per-org per-origin settings. Both are collections.

**Why problematic:** Singular vs plural implies one is a single config and the other a collection, but both are `Record` maps. False distinction.

| Name | Pros | Cons |
|---|---|---|
| **Both `originConfigs`** | Consistent, minimal change (only UserOrg renamed). | Still doesn't clarify Org vs UserOrg without context. |
| **`orgOriginConfigs` / `userOriginConfigs`** | Explicit ownership. | Redundant — `Org.orgOriginConfigs` stutters. |
| **Both `originSettings`** | Avoids "config" overload (see item 3). | Third term in crowded namespace. |

**Recommendation: Both `originConfigs`** (rename `UserOrg.originConfig` to plural).

---

## 3. `BaseOriginConfig` vs `BaseOriginDefinition`

**What they represent:**
- `BaseOriginDefinition` — `{ _tag, activeResources }`. Stored in `Org.origins`. Describes **what an origin is** (capabilities). Org-level.
- `BaseOriginConfig` — `{ _tag }` (local to UserOrg.ts). Stored in `UserOrg.originConfig`. Holds **per-user credentials/settings** (e.g., OAuth tokens). User-level.

**Why problematic:** "Config" and "Definition" are near-synonyms. The `OriginType.make` function receives both and a reader must look at both schemas to differentiate. "Config" is also triply overloaded (`originConfig`, `originConfigs`, `BaseOriginConfig`).

| Name pair | Pros | Cons |
|---|---|---|
| **`BaseOriginDefinition` / `BaseOriginCredentials`** | "Credentials" clearly signals user-specific auth data. Strong differentiation. | May be narrow if non-credential settings are added later. |
| **`BaseOriginDefinition` / `BaseOriginUserConfig`** | Adds "User" for disambiguation. | Still uses overloaded "config." |
| **`BaseOriginSpec` / `BaseOriginConfig`** | "Spec" for org-level; "config" for user-level. | "Spec" is unusual in this codebase. |

**Recommendation: Keep `BaseOriginDefinition`, rename `BaseOriginConfig` to `BaseOriginCredentials`.**

---

## 4. `OriginType`

**What it represents:** An interface with `{ tag: string, make: (...) => Effect<Origin.AnyState> }`. It is a **factory protocol** — infrastructure packages implement it to register as handlers for a particular origin `_tag`. Used in `HubStateUpdater` to build a dispatch table.

**Why problematic:** `OriginType` reads as a type alias or enum of origin kinds. Gives no hint it carries a factory method. The `Type` suffix is confusing in TypeScript where `Type` is a common Schema property.

| Name | Pros | Cons |
|---|---|---|
| **`OriginFactory`** | Immediately communicates factory pattern. Well-understood. | Slightly informal. |
| **`OriginConstructor`** | More precise. | Confusable with JS class constructors. |
| **`OriginDriver`** | "Driver" pattern (like DB drivers). | Less immediately obvious. |
| **`OriginAdapter`** | Standard integration pattern. | Could be confused with GoF adapter. |

**Recommendation: `OriginFactory`** — the interface's sole purpose is to construct (`make`) an origin state from a definition.

---

## 5. `tryGetAuthData`

**What it represents:** Static method on `AuthDataService` that takes the first emission from `authDataStream`, failing with `UnhandledError` if the stream is closed or `AuthError` if auth failed. Return type: `Effect<AuthData, AuthError | UnhandledError, Scope | AuthDataService>`.

**Why problematic:** In Effect-TS, `try` means "catches exceptions and converts to typed errors" (e.g., `Effect.try`, `Effect.tryPromise`). This method does not catch exceptions — it reads a stream head and maps the result. The prefix is misleading about the mechanism and redundant (all Effects can fail via their error channel).

| Name | Pros | Cons |
|---|---|---|
| **`getAuthDataFromStream`** | Explicit about mechanism. | Verbose; exposes implementation detail. |
| **`awaitAuthData`** | Conveys "wait for first emission." | Confusable with JS `await`. |
| **`getAuthData`** | Simple, matches Effect convention. Parallels `authData` field. | Could be confused with `authData` field, though static method vs instance field distinguishes them. |

**Recommendation: `getAuthData`** — drop the `try` prefix. In Effect-TS, the error channel already communicates fallibility.

---

## Summary

| # | Current | Recommended | Scope |
|---|---|---|---|
| 1 | `BaseOriginDefinition.activeResources` | `supportedResources` | Schema transform + Firestore migration |
| 2 | `UserOrg.originConfig` (singular) | `originConfigs` (plural) | Schema rename |
| 3 | `BaseOriginConfig` | `BaseOriginCredentials` | Rename local schema in UserOrg.ts |
| 4 | `OriginType` | `OriginFactory` | Rename interface + all references |
| 5 | `AuthDataService.tryGetAuthData` | `AuthDataService.getAuthData` | Rename static method |
