# Config Refactor — Implementation Handoff

## Progress (updated by agent)

- **Phase 1**: DONE — All schemas created, UriEncodedOriginUrl + CredentialId branded types, apiKey removed, 18 new tests passing
- **Phase 2**: DONE — Org schema uses origins/originConfigs, FrontendConfig deleted, UserOrgConfig created, all consumers updated
- **Phase 2.5**: DONE — Config/Org split: `ConfiguredOrg` created in config-domain, `UserOrgConfig` moved to config-domain, `Org` in platform-domain split into `PlatformOrg` + `Org = extend(PlatformOrg, ConfiguredOrg)`
- **Phase 3**: DONE — DailyCoContext deleted from DailyCoConfig.ts, DailyCoMeetingTokenService + test deleted, empty services dir removed
- **Phase 4**: DONE — CredentialLoader + CredentialSyncer created, AccessTokenSyncer refactored to use CredentialSyncer, platform-domain vitest config added, pre-existing test failures fixed
- **Phase 5-9**: Not started

### Verification status

All checks pass as of end of Phase 4:
- `npm run typecheck` — 25/25 packages
- `npm run test` (unit) — 115 test files, 577 tests
- `npm run build` — 33/33 tasks

### Deviations from plan
- `origins` and `originConfigs` on Org use `Schema.optionalWith({ default: () => ({}) })` for backward-compat with existing Firestore docs
- `activeResources` keys are fixed per origin type (literal unions) rather than `Schema.String`
- Added `CredentialId` branded type in config-domain (not in original plan)
- Added `vitest.unit.config.ts` to config-domain (didn't exist before)
- `@assessmentis/config-domain` and `@assessmentis/effectful-store` added as explicit deps to platform-domain
- `ConfiguredOrg` (origins + originConfigs) extracted to config-domain; `PlatformOrg` holds platform-specific fields (slug, emoji, sync timestamps); `Org = Schema.extend(PlatformOrg, ConfiguredOrg)` in platform-domain preserves API for all consumers
- `UserOrgConfig` moved from platform-domain to config-domain (exported via `origin/` barrel)
- `@assessmentis/effectful-store` added as dep of config-domain (for `UriEncodedOriginUrl`)
- `CredentialSyncer` placed in `platform-domain/src/services/` (not `hostedServices/` as plan said) — it's a factory function, not a hosted service
- `CredentialSyncerConfig.path` typed as `readonly [string, string, string, string]` (4-element tuple) instead of `DocumentPath` to avoid TypeScript spread-typing issues with the `DocumentPath` intersection type
- `CredentialSyncerConfig.refreshEffect` error type is `unknown` (always caught internally via `Effect.catchAll`) instead of `UnhandledError`
- `CredentialSyncer` does not have a `shutdown` field — cleanup is handled by the stream switching semantics of `StreamEither.flatMap({ switch: true })` in AccessTokenSyncer
- AccessTokenSyncer now uses new credential path `users/{userId}/credentials/google-oauth` and `GoogleOAuthCredential` schema — Phase 8 data migration is needed for this to work at runtime
- Added `vitest.unit.config.ts` to platform-domain — **previously had no vitest config, so 44 tests were silently not running**
- Fixed pre-existing LoadedOrg test (missing `emoji` field after Phase 2 schema change; expected `UnhandledError` but `LiteralLoadedOrgLayer` actually produces `BadDataError`)
- Fixed pre-existing LoadedUser test (expected `NotFoundError` for undefined data but `decodeUser` calls `.asUnhandledError()` so it returns `UnhandledError`)

## Context

The current `FrontendConfig` on the Org document is monolithic — it bundles routing details, operational config, and integration choices into one field. This refactor decomposes config into OriginDefinition, OriginConfig, and Credential layers, dissolves the `FhirR4ClientService` mediator in favor of direct config→Hub wiring, and removes dead code.

**Design doc**: `docs/Architecture/Clinical Data Configuration Explanation.md`
**Working notes**: `Config Refactor.md` (project root)

## Key Concepts

Three config layers, all stored in the platform DocumentStore:

1. **OriginDefinition** (public, on Org doc) — declares an origin URL, its type tag, what resources it serves, and type-specific routing details
2. **OriginConfig** (Org-level and User-level separately) — non-secret operational config, may reference a Credential by ID
3. **Credential** (ServerCredential on orgs, UserCredential on users) — auth material independent of origins

**Document paths:**

```text
orgs/{orgSlug}                               → Org doc (origins + originConfigs maps)
orgs/{orgSlug}/credentials/{credentialId}    → Server credentials (API keys, service accounts)
orgs/{orgSlug}/users/{userId}                → Org-user roles (existing, unchanged)
users/{userId}                               → User profile (existing, unchanged)
users/{userId}/orgs/{orgSlug}                → User's per-org origin configs (NEW)
users/{userId}/credentials/{credentialId}    → User credentials (replaces users/{userId}/tokens/)
```

**Map keys** in `origins`, `originConfigs`, and user `originConfigs` are URI-encoded origin URLs via `ReadonlyUrl.asUriComponent()`. Use the new branded `UriEncodedOriginUrl` type.

## Resolved Design Decisions

1. **activeResources**: Infrastructure declares max capabilities. OriginDefinition filters to what the org has enabled. Hub registers the intersection (config filters infra capabilities).
2. **Map key type**: Branded `UriEncodedOriginUrl` in effectful-store alongside `ReadonlyUrl`. Prevents accidentally using raw URLs as keys.
3. **No BrowserIndexedDb**: Not in scope for this round. The config schema design allows it but no code implements it.
4. **OrgCredential → ServerCredential**: Named for where it's allowed to be used (server processes), not where it's stored.
5. **FhirR4ClientService dissolved**: Replaced by direct per-origin registration functions in infrastructure packages, called from PlatformContextProvider. No more mediator between config and Hub.
6. **DailyCoContext eliminated**: Confirmed dead code — never wired up outside tests. `makeDailyCoReadyOrigin` already takes direct params.
7. **CredentialSyncer abstraction**: Generic pattern that AccessTokenSyncer implements. Subscribes to credential docs, handles refresh scheduling, feeds into origin registration.
8. **No fallback to frontendConfig**: Clean cut. Delete FrontendConfig when origins/originConfigs are added to Org.

---

## What's been built (Phases 1-4)

### config-domain new files
- `src/origin/OriginDefinition.ts` — `GoogleFhirOriginDefinition`, `DailyCoOriginDefinition`, `OriginDefinition` union
- `src/origin/OrgOriginConfig.ts` — `GoogleFhirOrgOriginConfig`, `DailyCoOrgOriginConfig`, `OrgOriginConfig` union
- `src/origin/UserOriginConfig.ts` — `GoogleFhirUserOriginConfig`, `DailyCoUserOriginConfig`, `UserOriginConfig` union
- `src/origin/ConfiguredOrg.ts` — Schema with `origins` + `originConfigs` maps (with empty-object defaults)
- `src/origin/UserOrgConfig.ts` — Schema with `originConfigs` map (moved from platform-domain)
- `src/credential/CredentialId.ts` — Branded string type
- `src/credential/ServerCredential.ts` — `DailyCoApiKeyCredential`, `GoogleServiceAccountCredential`, `ServerCredential` union
- `src/credential/UserCredential.ts` — `GoogleOAuthCredential`, `UserCredential` union
- Tests for all of the above (property-based round-trip + defaults)

### platform-domain new/modified files
- `src/models/Org.ts` — `PlatformOrg` (slug, emoji, sync timestamps) + `Org = Schema.extend(PlatformOrg, ConfiguredOrg)`
- `src/services/CredentialLoader.ts` — `loadServerCredential()` and `loadUserCredential()` (read from DocumentStore + decode)
- `src/services/CredentialSyncer.ts` — `startCredentialSyncer()` (subscribe to credential doc, decode, schedule refresh)
- `src/services/index.ts` — exports CredentialLoader + CredentialSyncer
- `vitest.unit.config.ts` — NEW (was missing entirely)
- Tests: `CredentialLoader.test.ts` (6 tests), `CredentialSyncer.test.ts` (5 tests)

### effectful-store new files
- `src/UriEncodedOriginUrl.ts` — Branded string + `fromReadonlyUrl()` helper

### infrastructure changes
- `google-fhir-web-infrastructure/src/hostedServices/AccessTokenSyncer.ts` — Refactored to use `startCredentialSyncer`, creates/destroys syncer instances per user within `StreamEither.flatMap`
- `daily-co-infrastructure/src/services/` — Deleted (DailyCoMeetingTokenService + test removed)
- `daily-co-infrastructure/src/index.ts` — Cleaned up exports

### Deleted files
- `domain/platform-domain/src/models/FrontendConfig.ts`
- `domain/platform-domain/src/models/UserOrgConfig.ts` (moved to config-domain)
- `infrastructure/daily-co-infrastructure/src/services/DailyCoMeetingTokenService.ts`
- `infrastructure/daily-co-infrastructure/src/services/DailyCoMeetingTokenService.test.ts`

---

## Phase 5: UserOrgConfigService

**Goal**: Streaming service for `users/{userId}/orgs/{orgSlug}` — the per-user origin config document.

### Create service

**`domain/platform-domain/src/hostedServices/UserOrgConfigService.ts`**

Follow the OrgService/UserService PubSub+Stream pattern:
1. Create `UserOrgConfigService` Context.Tag
2. `startUserOrgConfigService(pubSub, authDataStream, orgSlugStream)`:
   - Combine `authDataStream` (userId) + `orgSlugStream` (orgSlug)
   - Subscribe to `documentStore.subscribeTo('users', userId, 'orgs', orgSlug)`
   - Decode with `UserOrgConfig` schema (now in `@assessmentis/config-domain`)
   - Publish to PubSub
3. Expose `userOrgConfigStream` and `userOrgConfig` (single-value effect)

**Key dependency pattern**: When either userId or orgSlug changes, the subscription switches (use `{ switch: true }` like OrgService does).

### Key references for implementing
- `domain/platform-domain/src/hostedServices/OrgService.ts` — PubSub+Stream pattern with switching
- `domain/platform-domain/src/hostedServices/UserService.ts` — Derives from authDataStream + DocumentStore
- `domain/platform-domain/src/tagClasses/AuthDataService.ts` — `authDataStream` and `AuthData` types
- `@assessmentis/util` — `StreamEither`, `pubsubAsPerpetualStream`, `takeOneFromPubSubOrDie`

### Barrel exports

**`domain/platform-domain/src/hostedServices/index.ts`** — add export
**`domain/platform-domain/src/index.ts`** — re-export

### Tests

Unit test following patterns in `OrgService` / `UserService` tests (if they exist) or `LoadedOrg.test.ts`.

---

## Phase 6: Dissolve FhirR4ClientService — Frontend Direct Config→Hub Wiring

**Goal**: Replace the monolithic FhirR4ClientService with direct per-origin registration driven by config.

### Create registerGoogleFhirOrigin

**`infrastructure/google-fhir-web-infrastructure/src/hostedServices/registerGoogleFhirOrigin.ts`**

This function absorbs the relevant logic from `GapiGoogleHealthcareClientLayer.ts` (the `startGapiGoogleHealthcareClient` function) + the stream orchestration from `FhirR4ClientService.tsx`:

```typescript
export const registerGoogleFhirOrigin = (
  hub: Hub<ResourceDataTypes>,
  originUrl: ReadonlyUrl,
  definition: GoogleFhirOriginDefinition,
  credentialSyncer: CredentialSyncer<GoogleOAuthCredential>,
): Effect<{ shutdown: Effect<void> }, ..., LoadedGapiClient | LoadedGapiHealthcareClient | Scope>
```

**Implementation:**
1. Build `baseOrigin` from definition fields (originUrl, activeResources, provokeReauthenticate/provokeReauthorize)
2. Immediately register `NotReadyOrigin` with `errorStatus: Loading` via `hub.setOriginState()`
3. Watch `credentialSyncer.credentialStream`:
   - On `Right(credential)`: set gapi token, build FHIR client, call `hub.setOriginState(makeFhirR4ReadyOrigin(...))`
   - On `Left(error)`: call `hub.setOriginState(NotReadyOrigin with AuthError.Unauthenticated)`
4. The `provokeReauthenticate` callback calls `credentialSyncer.provokeRefresh()`
5. Return `{ shutdown }` that cleans up the stream subscription and deregisters the origin

**Existing code to absorb:**
- `GapiGoogleHealthcareClientLayer.ts` lines 110-321: FHIR client construction (read, search, create, update, delete, executeBundle handlers)
- `GapiGoogleHealthcareClientLayer.ts` lines 148-164: Token retry loop → replaced by credentialSyncer stream
- The `makeFhirR4ReadyOrigin` call and `hub.setOriginState` calls

**What stays in GapiGoogleHealthcareClientLayer.ts:**
- The `LoadedGoogleFhirConfig` Context.Tag consumption (but `apiKey` removed)
- The actual FHIR client implementation (HTTP handlers)
- OR: merge everything into `registerGoogleFhirOrigin` and delete `GapiGoogleHealthcareClientLayer.ts`

### Rewrite PlatformContextProvider

**`apps/frontend/app/layers/PlatformContextProvider.tsx`**

Major changes:
1. **Add**: Start `UserOrgConfigService` (after OrgService + UserService)
2. **Replace FhirR4ClientService** with an origin registration loop:

```typescript
// Pseudocode for the origin registration loop
const orgAndUserConfigStream = Stream.combine(orgService.activeOrgStream, userOrgConfigService.userOrgConfigStream)

// For each (org, userConfig) pair:
//   1. Diff origins against previously registered origins
//   2. Deregister removed origins via hub.deregisterOrigin()
//   3. For each new/changed origin, match on _tag:
//      - 'google_fhir':
//        a. Get credentialId from userConfig.originConfigs[encodedUrl]
//        b. Start credentialSyncer for that credential path
//        c. Call registerGoogleFhirOrigin(hub, url, definition, syncer)
//      - 'daily_co': skip for now (or register if ready)
```

3. **Remove from PlatformContext interface**: `fhirR4ClientService` field. Components already use `useHub()`, `useResourceSubscription()`, etc. — they don't access `fhirR4ClientService` directly.
4. **Remove**: FhirR4ClientService PubSub creation

### Delete

- `apps/frontend/app/layers/FhirR4ClientService.tsx`
- `apps/frontend/app/layers/FhirR4ClientService.test.tsx` (if exists)

### Update PlatformContext

**`apps/frontend/app/layers/PlatformContext.tsx`** — Remove `fhirR4ClientService` from the interface. Add `userOrgConfigService` if needed by downstream components.

### Update tests

- `apps/frontend/app/layers/PlatformContextProvider.test.tsx` — update for new service wiring
- `apps/frontend/app/test-utils.ts` — update `createMockPlatformContext()` to remove fhirR4ClientService
- Any tests that reference `fhirR4ClientService` from the platform context

---

## Phase 7: Dissolve FhirR4ClientService — Backend

**Goal**: Backend equivalent of Phase 6.

### Modify backend FhirR4ClientService

**`apps/functions/src/layers/FhirR4ClientService.ts`**

Replace the `Match.value(frontendConfig.fhirServer)` pattern with:
1. Read `org.origins` to find entries by `_tag`
2. For `google_fhir`: extract `{ projectId, region, dataset, storeId }` from the OriginDefinition
3. Provide as `LoadedGoogleFhirConfig` to `NodeGoogleHealthcareFhirR4ClientLayer` (same as before, just sourced differently)

Alternatively, rename/restructure this into a more generic `originLayerFromConfig` utility.

### Update syncVideoCallRecordingsEffect

**`apps/functions/src/effects/syncVideoCallRecordingsEffect.ts`**

Line ~328: Change the eligibility filter from:
```typescript
const vcClient = data?.frontendConfig?.videoCallClient
return vcClient?._tag && vcClient._tag !== 'not_implemented'
```
To: Check for a `daily_co` entry in `data?.origins`.

### Remove apiKey from node infrastructure

**`infrastructure/google-fhir-node-infrastructure/src/NodeGoogleHealthcareClientLayer.ts`** — Remove `apiKey` from the `LoadedGoogleFhirConfig` destructuring (if still referenced after Phase 1 change).

---

## Phase 8: Rewire Credential Storage Paths

**Goal**: Move from hardcoded token paths to config-driven credential paths.

**Important**: AccessTokenSyncer already reads from the new path `users/{userId}/credentials/google-oauth` (changed in Phase 4). This phase ensures the backend **writes** to that path too.

### OAuth callback and refresh

**`apps/functions/src/functions/oAuthCallback.ts`** — Store tokens at `users/{userId}/credentials/google-oauth` with `GoogleOAuthCredential` schema shape (`{ _tag: 'google_oauth', accessToken, expiresAt, scope, email }`).

**`apps/functions/src/functions/refreshGoogleOAuthToken.ts`** — Read refresh token from `users/{userId}/credentials/google-oauth` (or a separate restricted doc). Write updated access token to same path matching `GoogleOAuthCredential` schema.

**`infrastructure/firebase-server-infrastructure/src/services/AuthRepository.ts`** — Update `storeOAuthTokens` and `updateAccessToken` to use new paths and schema shape.

### Firestore Timestamp → Date consideration

The `GoogleOAuthCredential` schema uses `Schema.DateFromSelf` for `expiresAt`. Firestore stores Timestamps. The backend write functions must write JS `Date` objects (Firestore SDK converts them to Timestamps automatically). The DocumentStore `subscribeTo` returns raw Firestore data where Timestamps have `.toDate()`. May need a custom schema transform (`Schema.transform`) for `expiresAt` that handles Firestore Timestamps, or handle conversion in the DocumentStore implementation.

### Org secret migration

**`apps/functions/src/layers/orgSecretLayers.ts`** — Refactor `makeOrgSecretLayer` to become `makeServerCredentialLayer` that loads from `orgs/{slug}/credentials/{credentialId}` where `credentialId` comes from the origin's `OrgOriginConfig.credentialId`.

### Firestore rules

**`infrastructure/firebase-web-infrastructure/firestore.rules`** — Add rules for:
- `users/{uid}/credentials/{credentialId}` (user can read own, admins can write)
- `users/{uid}/orgs/{orgSlug}` (user can read/write own, org admins can read)
- `orgs/{orgSlug}/credentials/{credentialId}` (org admins only)

---

## Phase 9: Final Cleanup

**Goal**: Remove any remaining legacy code and verify completeness.

- Grep for `FrontendConfig`, `frontendConfig`, `fhirServer`, `videoCallClient` — should have zero matches
- Grep for `users/{userId}/tokens/` path usage — should have zero matches
- Grep for `orgs/{orgSlug}/secrets/` path usage — should have zero matches
- Remove `DailyCoConfig` from config-domain if fully replaced by `DailyCoOriginDefinition` + `DailyCoOrgOriginConfig`
- Update `docs/Architecture/Explanation.md` to reflect new Platform Service Architecture (no more FhirR4ClientService in the tree)
- Update `apps/frontend/app/layers/Platform Services Reference.md`

### Final verification

```bash
npm run typecheck
npm run test
npm run build
npm run lint:fix
```

---

## Critical File Reference

| File | Role | Phase |
|------|------|-------|
| `domain/config-domain/src/GoogleFhirConfig.ts` | apiKey removed, LoadedGoogleFhirConfig tag kept | 1 ✅ |
| `domain/config-domain/src/DailyCoConfig.ts` | DailyCoContext removed, DailyCoConfig + RecordingsBucket kept | 3 ✅ |
| `domain/config-domain/src/origin/ConfiguredOrg.ts` | origins + originConfigs schema (used by Org via Schema.extend) | 2.5 ✅ |
| `domain/config-domain/src/origin/UserOrgConfig.ts` | User per-org origin configs (moved from platform-domain) | 2.5 ✅ |
| `domain/platform-domain/src/models/Org.ts` | PlatformOrg + Org = extend(PlatformOrg, ConfiguredOrg) | 2/2.5 ✅ |
| `domain/platform-domain/src/services/CredentialLoader.ts` | loadServerCredential + loadUserCredential | 4 ✅ |
| `domain/platform-domain/src/services/CredentialSyncer.ts` | startCredentialSyncer (subscribe + decode + refresh) | 4 ✅ |
| `infrastructure/google-fhir-web-infrastructure/src/hostedServices/AccessTokenSyncer.ts` | Refactored to use CredentialSyncer | 4 ✅ |
| `global/effectful-store/src/ReadonlyUrl.ts` | Has `asUriComponent()` — used for map key encoding | ref |
| `global/effectful-store/src/OriginState.ts` | ReadyOrigin / NotReadyOrigin types | ref |
| `global/effectful-store/src/Hub.ts` | `setOriginState()`, `deregisterOrigin()` | ref |
| `infrastructure/google-fhir-web-infrastructure/src/hostedServices/GapiGoogleHealthcareClientLayer.ts` | Origin registration logic to absorb into registerGoogleFhirOrigin | 6 |
| `infrastructure/daily-co-infrastructure/src/DailyCoOrigin.ts` | `makeDailyCoReadyOrigin` — already takes direct params, keep as-is | ref |
| `apps/frontend/app/layers/PlatformContextProvider.tsx` | Major rewrite — wire new services, direct origin registration | 6 |
| `apps/frontend/app/layers/FhirR4ClientService.tsx` | DELETE | 6 |
| `apps/frontend/app/layers/PlatformContext.tsx` | Remove fhirR4ClientService from interface | 6 |
| `apps/functions/src/layers/FhirR4ClientService.ts` | Rewrite to read from org.origins | 7 |
| `apps/functions/src/effects/syncVideoCallRecordingsEffect.ts` | Update org eligibility filter | 7 |
| `apps/functions/src/functions/oAuthCallback.ts` | Update token storage path + schema shape | 8 |
| `apps/functions/src/functions/refreshGoogleOAuthToken.ts` | Update token read/write path | 8 |
| `infrastructure/firebase-server-infrastructure/src/services/AuthRepository.ts` | Update storage paths | 8 |
| `apps/functions/src/layers/orgSecretLayers.ts` | Refactor to credential loading | 8 |
| `domain/fhir-r4/src/FhirR4Origin.ts` | `makeFhirR4ReadyOrigin` — still used, no changes | ref |

## Existing Patterns to Reuse

- **PubSub + Stream pattern**: See `OrgService.ts` and `UserService.ts` in `domain/platform-domain/src/hostedServices/` — UserOrgConfigService follows this exactly
- **Schema.TaggedStruct**: Used throughout config-domain for discriminated unions
- **ReadonlyUrl.asUriComponent()**: Already exists in `global/effectful-store/src/ReadonlyUrl.ts`
- **makeFhirR4ReadyOrigin**: `domain/fhir-r4/src/FhirR4Origin.ts` — takes FhirR4Client + originUrl + callbacks, returns ReadyOrigin
- **makeDailyCoReadyOrigin**: `infrastructure/daily-co-infrastructure/src/DailyCoOrigin.ts` — takes httpClient + headersEffect + config, returns ReadyOrigin
- **Property-based tests**: See `domain/platform-domain/src/models/IdTypes.test.ts` for round-trip testing pattern
- **DocumentStore**: `domain/platform-domain/src/tagClasses/DocumentStore.ts` — `get(path)` and `subscribeTo(path)` with 2/4/6-element paths
- **Schema.decodeUnknown**: Used in OrgService, UserService, LoadedOrg for validating Firestore data
- **CredentialSyncer**: `domain/platform-domain/src/services/CredentialSyncer.ts` — subscribe to credential doc, decode with schema, schedule refresh. Used by AccessTokenSyncer, will be used by registerGoogleFhirOrigin in Phase 6
- **CredentialLoader**: `domain/platform-domain/src/services/CredentialLoader.ts` — one-shot read of credentials from DocumentStore with schema decoding
- **Mock DocumentStore**: `domain/platform-domain/src/services/__tests__/mocks.ts` — `mockDocumentStore()` and `mockDocumentStoreImplementations` for testing
