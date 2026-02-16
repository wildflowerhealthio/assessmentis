# FHIR Modeling Reference

This reference documents how FHIR R4 resources are modeled in clinical-domain.

For step-by-step Clinical Resource implementation, see [docs/Adding Resource Types How-To.md](./docs/Adding%20Resource%20Types%20How-To.md). For understanding the schema transformation pattern, see [docs/FHIR Schemas Explanation.md](./docs/FHIR%20Schemas%20Explanation.md).

## Core modeling rules

- Use Effect Schema for all resource modeling.
- Every resource must include resourceType as a literal.
- Model identifiers as branded Schema types (for example PatientId).
- Extend Resource or DomainResource for base fields.
- Use Schema.suspend for recursive types and references.
- Prefer value sets under value-sets/ for constrained coded values.
- Use TimelessDateFromString for date-only fields when applicable.
- Use Schema.DateTimeUtc for instants and timestamps.
- Resource ids are optional on create but required on read/update results; use WithId + assertId where needed.

## Schema structure conventions

- Base types live under data-types/ (Element, Resource, DomainResource).
- Resource-specific schemas live under resource categories (administration, diagnostic-medicine, content-management).
- Shared complex types live under data-types/complex and data-types/special-purpose.
- Register all resource schemas in Schemas.ts for repository wiring.

## Testing expectations

- Add property tests for schemas and round-trip encode/decode.
- Keep test files alongside resource files.
- Prefer Effect Schema Arbitrary and fast-check for property coverage.

## Most-used code locations

- Resource base types: [src/data-types/base](src/data-types/base)
- DomainResource base: [src/data-types/base/DomainResource.ts](src/data-types/base/DomainResource.ts)
- Example resource: [src/administration/resources/Patient.ts](src/administration/resources/Patient.ts)
- Clinical Resource How-To: [docs/Adding Resource Types How-To.md](./docs/Adding%20Resource%20Types%20How-To.md)
- Resource registry: [src/Schemas.ts](src/Schemas.ts)
- Repository factory: [src/assessmentis/makeClinicalDataRepository.ts](src/assessmentis/makeClinicalDataRepository.ts)
- Resource tests: [src/administration/resources](src/administration/resources)
