# Clinical Data Configuration Explanation

How clinical data origins are configured, credentialed, and wired to the Hub across frontend and server environments.

For architecture context, see [Architecture Explanation](./Explanation.md). For the Hub design, see the [Hub Design Explanation](../../global/effectful-store/docs/Hub%20Design%20Explanation.md).

## Overview

Clinical data can come from multiple external services (Google Healthcare FHIR, Daily.co, browser IndexedDB). The configuration system decouples three concerns:

1. **What origins exist and what they serve** — public, per-org
2. **How to connect to each origin** — per-org operational config and per-user credential bindings
3. **Authentication material** — credentials stored independently on orgs and users

This separation allows the same org to have multiple origins, lets users bring their own credentials, and lets server processes use org-level credentials for background tasks.

## Concepts

### OriginDefinition

A public, org-level declaration of a data origin. Each definition is polymorphic (tagged by origin type) and includes:

- `_tag` — the origin type (`google_fhir`, `daily_co`, `browser_indexeddb`, etc.)
- `activeResources` — which FHIR resource types this origin serves (e.g., `{ Patient: true, Encounter: true }`)
- Type-specific routing details that identify _where_ the origin is

The origin URL (used as the Hub routing key) is stored explicitly as the map key (URI-encoded via `ReadonlyUrl.asUriComponent()`).

**Google FHIR** includes `projectId`, `region`, `dataset`, `storeId` — the fields that locate a specific FHIR store.

**Daily.co** includes `proxyUrl` — the proxy endpoint that fronts the Daily.co API.

**Browser IndexedDB** needs no additional routing fields — the origin is local to the browser.

### OriginServerConfig / OriginUserConfig

Non-secret operational configuration for connecting to an origin. Exists at two levels:

- **Org-level** (`OriginServerConfig`, stored as `Org.originServerConfigs`) — config that applies to the whole org, like a Daily.co recordings bucket or a credential reference for server-side access.
- **User-level** (`OriginUserConfig`, stored as `UserOrg.originUserConfigs`) — per-user bindings, primarily credential references (e.g., which Google OAuth credential to use for a given FHIR origin).

Both are polymorphic and keyed by URI-encoded origin URL. Not every origin needs config at both levels — a browser IndexedDB origin may need neither.

In any given runtime context, only one level is used: the frontend merges user configs into origin definitions, while server processes merge server configs. The generic effectful-store layer (`OriginSourceSnapshot`) receives the already-merged result and is agnostic to the source.

### Credential

Authentication material (OAuth tokens, API keys, service account keys). Stored independently of origins so that:

- One credential can be shared across multiple origins (e.g., a single Google account accessing multiple FHIR stores)
- Credentials can be managed (rotated, revoked) without touching origin config
- Access control is separate from configuration

Credentials are polymorphic. Each has a `_tag` identifying its type. The `credentialId` is a semantic identifier (e.g., `google-oauth-main`, `daily-co-api-key`).

## Document Store Layout

```text
orgs/{orgSlug}                                    → Org doc (includes origins + originServerConfigs)
orgs/{orgSlug}/credentials/{credentialId}         → Org-level credentials (API keys, service accounts)
orgs/{orgSlug}/users/{userId}                     → Org-user roles (existing, unchanged)
users/{userId}                                    → User profile (existing, unchanged)
users/{userId}/orgs/{orgSlug}                     → User's per-org origin user configs
users/{userId}/credentials/{credentialId}         → User credentials (OAuth tokens)
```

### Org Document — `orgs/{orgSlug}`

The org document contains two separate maps, both keyed by URI-encoded origin URL:

- `origins: Record<string, OriginDefinition>` — public, describes what origins exist and what resources they serve
- `originServerConfigs: Record<string, OriginServerConfig>` — restricted, operational config per origin

These are separate fields (not merged) to enable field-level access control in Firestore. The `origins` field can be readable by any org member, while `originServerConfigs` may be restricted to admins.

### User Per-Org Config — `users/{userId}/orgs/{orgSlug}`

Contains `originUserConfigs: Record<string, OriginUserConfig>` — the user's per-origin configuration for that org. Primarily holds credential references.

Stored under the user's path (not the org's) so that Firestore security rules can grant the user read/write access to their own config while still allowing org admins to read it.

## Origin Types

### Google Healthcare FHIR R4

**OriginDefinition fields:** `projectId`, `region`, `dataset`, `storeId`

These fields locate a specific Google Cloud Healthcare FHIR store. The origin URL follows the Healthcare API pattern: `https://healthcare.googleapis.com/v1/projects/{projectId}/locations/{region}/datasets/{dataset}/fhirStores/{storeId}/fhir`.

**OriginServerConfig:** Optional `credentialId` referencing an org credential (e.g., a service account for Cloud Function access).

**OriginUserConfig:** Required `credentialId` referencing a user credential (Google OAuth token for browser-based access).

**ServerCredential:** Service account or API key for server-side access.

**UserCredential:** Google OAuth tokens (`accessToken`, `expiresAt`, `scope`, `email`). Refresh tokens are stored server-side only.

### Daily.co

**OriginDefinition fields:** `proxyUrl` — the proxy endpoint URL.

**OriginServerConfig:** Optional `recordingsBucket` (S3 configuration for recording storage) and optional `credentialId` referencing the Daily.co API key.

**OriginUserConfig:** Optional `credentialId` if user-level auth is needed.

**ServerCredential:** Daily.co API key.

### Browser IndexedDB (future)

**OriginDefinition fields:** None beyond the base.

No org config, user config, or credentials needed — everything is local.

## Wiring to the Hub

### Frontend

After the user selects an org:

1. Read the org's `origins` map to discover what origins exist
2. Read `users/{userId}/orgs/{orgSlug}` to get the user's origin user configs (credential bindings)
3. For each origin, resolve the credential and register a `ReadyOrigin` (or `NotReadyOrigin` if credentials are missing/expired) with the Hub via `hub.setOriginState()`
4. The Hub routes requests based on resource type and URL prefix matching

### Server (Cloud Functions)

For scheduled tasks or user-triggered server operations:

1. Read the org's `origins` and `originServerConfigs` maps
2. Read org-level credentials from `orgs/{orgSlug}/credentials/{credentialId}`
3. Register origins with the Hub using org credentials
4. Execute operations (e.g., sync Daily.co recordings to Google FHIR)

## Design Decisions

**Why separate OriginDefinition from OriginServerConfig/OriginUserConfig?** Different access control needs. Definitions are public metadata (any org member can see what services the org uses). Configs may contain sensitive operational details (credential references, S3 bucket ARNs).

**Why are credentials independent of origins?** A single Google account might access multiple FHIR stores. A credential rotation should not require updating every origin config that uses it. This also models reality: users log into Google once, not once per FHIR store.

**Why URI-encoded origin URLs as map keys?** The Hub already routes by origin URL prefix. Using the same URL as the config key creates a direct mapping between config and runtime state. URI encoding is needed because Firestore map keys cannot contain `/` or `.`. `ReadonlyUrl.asUriComponent()` already exists for this purpose.

**Why store the origin URL explicitly (not just derive it)?** For Google FHIR, the URL is derivable from the definition fields. But storing it explicitly makes the config self-describing and avoids coupling the config schema to URL construction logic. The stored key is the source of truth for routing.

## See Also

- [Architecture Explanation](./Explanation.md) — Layered architecture overview
- [Hub Design Explanation](../../global/effectful-store/docs/Hub%20Design%20Explanation.md) — How the Hub routes requests to origins
- [Platform Services Reference](../../apps/frontend/app/layers/Platform%20Services%20Reference.md) — Frontend service wiring
