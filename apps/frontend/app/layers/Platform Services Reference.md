# Platform Services Reference

This reference describes the client-side platform service graph used by the frontend layer and where each service is wired.

## Service lifecycle overview

- Services are created in PlatformContextProvider and injected via PlatformContext.
- PubSub + Stream are the default patterns for reactive services (Auth, Org, User, FHIR).
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
- FhirR4ClientService — FHIR client and reactive client stream.
- ClinicalDataRepositoryService — repository factory for FHIR resources.
- VideoCallClientService — resolves video call client from org config.
- OrgContextProvider — org-scoped UI context and error boundary wiring.

## Boundary rules

- Prefer using service Effect/Stream outputs over direct SDK calls.
- Normalize ExternalAssertionError, BadDataError, and NotFoundError to UnhandledError when the UI does not have actionable handling.
- Avoid side effects in components; initialize services only in PlatformContextProvider.

## Most-used code locations

- Platform context wiring: [apps/frontend/app/layers/PlatformContextProvider.tsx](apps/frontend/app/layers/PlatformContextProvider.tsx)
- Context interface: [apps/frontend/app/layers/PlatformContext.tsx](apps/frontend/app/layers/PlatformContext.tsx)
- Org context provider: [apps/frontend/app/layers/OrgContextProvider.tsx](apps/frontend/app/layers/OrgContextProvider.tsx)
- Auth stream tag + pubsub: [domain/platform-domain/src/tagClasses/AuthDataService.ts](domain/platform-domain/src/tagClasses/AuthDataService.ts)
- Hosted services: [domain/platform-domain/src/hostedServices](domain/platform-domain/src/hostedServices)
- FHIR client service: [apps/frontend/app/layers/FhirR4ClientService.tsx](apps/frontend/app/layers/FhirR4ClientService.tsx)
- Clinical repository service: [apps/frontend/app/layers/ClinicalDataRepositoriesService.ts](apps/frontend/app/layers/ClinicalDataRepositoriesService.ts)
- Video call client service: [apps/frontend/app/layers/VideoCallClientService.tsx](apps/frontend/app/layers/VideoCallClientService.tsx)
