# Adding Resource Types How-To

How to add a new FHIR R4 Clinical Resource in `@assessmentis/clinical-domain` with full parity to existing Clinical Resources.

For cross-layer workflow, see [docs/Architecture/Adding Clinical Resource Types How-To.md](../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md).

## 1. Add the Clinical Resource schema

In `src/{category}/resources/{ResourceName}.ts`:

- Add `{ResourceName}Id` as a branded string schema
- Define `{ResourceName}` with `resourceType: Schema.Literal('{ResourceName}')`
- Extend `Resource({ResourceName}Id)` fields
- Add FHIR-compatible optional fields as needed
- Use the Omit + intersection pattern for fields with `FromFhirR4` schemas (see [FHIR Schemas Explanation](./FHIR%20Schemas%20Explanation.md))

Also export from `src/{category}/resources/index.ts`.

## 2. Add schema tests

Add `src/{category}/resources/{ResourceName}.test.ts` with:

- Compile-time encoded compatibility check against `fhir/r4` type
- Property test for encode/decode round-trip using `Arbitrary.make`

Keep tests beside the schema file.

## 3. Register in ResourceDataTypes

Update `src/ResourceDataTypes.ts`:

- Import the resource type
- Add it to both the `ResourceDataTypes` type and const

The resource data type key must match the domain type literal (e.g., `'Observation'`). The Hub (`ClinicalDomainHub`) will automatically support all CRUD and subscription operations for the new resource type.

## 5. Wire consumers and docs

- Frontend service wiring: [../../../apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md](../../../apps/frontend/app/modules/resources/Adding%20Clinical%20Resource%20Types%20How-To.md)
- Architecture-level flow: [../../../docs/Architecture/Adding Clinical Resource Types How-To.md](../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md)

## Most-used code locations

- Schema examples: [../src/resources](../src/resources)
- Resource data types: [../src/ResourceDataTypes.ts](../src/ResourceDataTypes.ts)
- Hub Tag: [../src/ClinicalDomainHub.ts](../src/ClinicalDomainHub.ts)

## See Also

- [FHIR Schemas Explanation](./FHIR%20Schemas%20Explanation.md) — Understanding the schema transformation pattern
- [FHIR Schemas How-To](./FHIR%20Schemas%20How-To.md) — Steps to transform a schema to use the explicit field pattern
- [FHIR Modeling Reference](./FHIR%20Modeling%20Reference.md) — Core modeling rules and conventions
