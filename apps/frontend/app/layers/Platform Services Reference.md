# Platform Services Reference

This reference describes the client-side platform service graph used by the frontend layer and where each service is wired.

## Service lifecycle overview

- Services are created in PlatformContextProvider and injected via PlatformContext.
- PubSub + Stream are the default patterns for reactive services (Auth, Org, User).
- The Hub manages all clinical data access (FHIR, Daily.co, etc.) through a single routing layer.
- CredentialService manages live watched credentials via `makeDocumentStoreCredentialRepository`.
- Normalize Effect/Stream errors at UI boundaries.
- OrgContextProvider consumes OrgService and provides org-scoped UI state.

## Adding a new platform service

- Define the Tag and public interface in platform-domain.
- Provide a concrete implementation in infrastructure and/or frontend layers.
- Wire creation and injection in PlatformContextProvider and extend PlatformContext.

## Service catalog

- AuthDataService — authentication stream and access token source. Interface lives in platform-domain, implementation provided by firebase-web-infrastructure.
- OrgService — org selection and active org stream (client-side hosted service).
- UserService — user profile/roles stream (client-side hosted service).
- Hub — single routing layer for all clinical data access (FHIR, Daily.co). Replaces the former per-resource repository pattern. See [Hub Design Explanation](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md).
- CredentialService — manages live watched credentials (e.g., Google OAuth tokens, Daily.co API keys) via `makeDocumentStoreCredentialRepository`. Credentials are stored at `users/{uid}/credentials/{credentialId}` and `orgs/{orgId}/credentials/{credentialId}` in Firestore. Server-side refresh available via `POST /api/credentials/:credential_id`.
- OrgContextProvider — org-scoped UI context and error boundary wiring.

## Boundary rules

- Prefer using service Effect/Stream outputs over direct SDK calls.
- Normalize ExternalAssertionError, BadDataError, and NotFoundError to UnhandledError when the UI does not have actionable handling.
- Avoid side effects in components; initialize services only in PlatformContextProvider.

## Most-used code locations

- Platform context wiring: [PlatformContextProvider.tsx](PlatformContextProvider.tsx)
- Context interface: [PlatformContext.tsx](PlatformContext.tsx)
- Org context provider: [OrgContextProvider.tsx](OrgContextProvider.tsx)
- Credential service: [CredentialService.ts](CredentialService.ts)
- Auth stream tag + pubsub: [../../../../domain/platform-domain/src/tagClasses/AuthDataService.ts](../../../../domain/platform-domain/src/tagClasses/AuthDataService.ts)
- Credential repository: [../../../../domain/platform-domain/src/tagClasses/CredentialRepository.ts](../../../../domain/platform-domain/src/tagClasses/CredentialRepository.ts)
- Hosted services: [../../../../domain/platform-domain/src/hostedServices](../../../../domain/platform-domain/src/hostedServices)
- Hub access hook: [useHub.ts](useHub.ts)
- Hub Tag (domain): [../../../../domain/clinical-domain/src/ClinicalDomainHub.ts](../../../../domain/clinical-domain/src/ClinicalDomainHub.ts)
- Resource data types: [../../../../domain/clinical-domain/src/ResourceDataTypes.ts](../../../../domain/clinical-domain/src/ResourceDataTypes.ts)
- Hub design: [../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md)
