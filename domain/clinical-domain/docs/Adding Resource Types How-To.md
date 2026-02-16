# Adding Resource Types How-To

How to add a new FHIR R4 Clinical Resource in `@assessmentis/clinical-domain` with full parity to existing Clinical Resources.

For cross-layer workflow, see [docs/Architecture/Adding Clinical Resource Types How-To.md](../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md).

## 1. Add the Clinical Resource schema

In `src/{category}/resources/{ResourceName}.ts`:

- Add `{ResourceName}Id` as a branded string schema
- Define `{ResourceName}` with `resourceType: Schema.Literal('{ResourceName}')`
- Extend `DomainResource({ResourceName}Id)` fields
- Add FHIR-compatible optional fields as needed
- Use the Omit + intersection pattern for fields with `FromFhirR4` schemas (see [FHIR Schemas Explanation](./FHIR%20Schemas%20Explanation.md))

Also export from `src/{category}/resources/index.ts`.

## 2. Add schema tests

Add `src/{category}/resources/{ResourceName}.test.ts` with:

- Compile-time encoded compatibility check against `fhir/r4` type
- Property test for encode/decode round-trip using `Arbitrary.make`

Keep tests beside the schema file.

## 3. Add the Clinical Resource repository Tag

In `src/{category}/contexts/{ResourceName}Repository.ts`:

- Define `Context.Tag('{ResourceName}Repository')`
- Service type must be `ClinicalDataRepository<{ResourceName}>`

Export from `src/{category}/contexts/index.ts`.

## 4. Register the Clinical Resource

Update:

- `src/Schemas.ts` to include `{ResourceName}`
- `src/Repositories.ts` to include `{ResourceName}: {ResourceName}Repository`
- `RepositoriesType` to include `{ResourceName}`

The schema and repository keys must match the FHIR `resourceType` literal.

## 5. Wire consumers and docs

- Frontend service wiring: [../../../apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md](../../../apps/frontend/app/modules/resources/Adding%20Clinical%20Resource%20Types%20How-To.md)
- Architecture-level flow: [../../../docs/Architecture/Adding Clinical Resource Types How-To.md](../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md)

## Most-used code locations

- Schema examples: [../src/administration/resources](../src/administration/resources)
- Repository Tag examples: [../src/administration/contexts](../src/administration/contexts)
- Schema registry: [../src/Schemas.ts](../src/Schemas.ts)
- Repository registry: [../src/Repositories.ts](../src/Repositories.ts)
- Generic repository implementation: [../src/assessmentis/makeClinicalDataRepository.ts](../src/assessmentis/makeClinicalDataRepository.ts)

## See Also

- [FHIR Schemas Explanation](./FHIR%20Schemas%20Explanation.md) — Understanding the schema transformation pattern
- [FHIR Schemas How-To](./FHIR%20Schemas%20How-To.md) — Steps to transform a schema to use the explicit field pattern
- [FHIR Modeling Reference](../FHIR%20Modeling%20Reference.md) — Core modeling rules and conventions
