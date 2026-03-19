# FHIR Schemas Explanation

FHIR schemas in clinical-domain use Effect Schema to define bidirectional transformations between FHIR R4 JSON (from external APIs) and typed domain objects. This doc explains the schema transformation pattern that makes these transformations explicit in the type system.

## The Transformation Pattern

FHIR resource schemas declare their input types using this pattern:

```typescript
DeepReadonly<
  Omit<AsDefinedFhirDomainResource<FhirPatient>, 'identifier' | 'name' | 'telecom'> & {
    identifier?: ReadonlyArray<typeof IdentifierFromFhirR4.Encoded>
    name?: ReadonlyArray<typeof HumanNameFromFhirR4.Encoded>
    telecom?: ReadonlyArray<typeof ContactPointFromFhirR4.Encoded>
  }
>
```

This tells the type system: "This schema accepts FHIR data where certain fields have already been transformed by their corresponding `FromFhirR4` schemas."

## Why This Pattern Exists

**Type Safety at Boundaries:** The pattern makes field transformations visible in the schema's type signature. If the FHIR spec changes a field type, the schema breaks at compile time, not runtime.

**Explicit Over Implicit:** Previously, schemas used `DeepReadonly<FhirPatient>` directly, hiding which fields were being transformed. The Omit + intersection pattern documents exactly what happens to each field.

**Composability:** Complex resources can compose simpler `FromFhirR4` schemas without ambiguity about transformation order or nesting.

**Maintainability:** Anyone reading the schema knows which fields need custom encoding and which pass through unchanged.

## How It Works

1. **Start with the base FHIR type** via `AsDefinedFhirDomainResource<T>` (which wraps raw FHIR types from `@types/fhir` and removes problematic fields like `extension`)

2. **Omit fields that need transformation** — these are complex types like Identifier, CodeableConcept, Period, Quantity, etc.

3. **Re-declare those fields** with their transformed types using `.Encoded` from the corresponding `FromFhirR4` schema

4. **Wrap everything in DeepReadonly** for immutability (Effect pattern)

## FromFhirR4 Schemas

Each `FromFhirR4` schema is an Effect Schema that defines how to parse and encode a FHIR data type:

```typescript
const IdentifierFromFhirR4: Schema.Schema<
  Identifier, // Output type (domain object)
  ReadonlyFhirIdentifierWithIds, // Input type (FHIR JSON)
  never // No dependencies
>
```

These schemas live in `src/data-types/complex/` and handle:

- Parsing FHIR JSON into typed domain objects
- Validating structure and required fields
- Encoding domain objects back to FHIR JSON
- Breaking circular dependencies (e.g., Reference ↔ Identifier) using `Schema.suspend()`

## Complexity Levels

**Simple resources** (Composition, Media): No Omit needed if all fields use primitive types or don't require custom transformation.

**Moderate resources** (DiagnosticReport): One or two fields like `identifier` need transformation.

**Complex resources** (Patient, Encounter, Observation): Dozens of fields with nested structures require transformation. Each nested structure (like Patient.contact or Encounter.participant) follows the same pattern.

## Current State

The refactor was started in commit `c12f77c` ("Split interfaces away from Schemas and define them independently"). Most resources and complex types now use the pattern:

**Completed:** Patient, Encounter, Location, Practitioner, Observation, DiagnosticReport, Annotation, Range, CodeableConcept, IdentifierAndReference, Period, Attachment

**In progress:** Some sub-components in Questionnaire, QuestionnaireResponse, Media

## See Also

- [FHIR Schemas How-To](./FHIR%20Schemas%20How-To.md) — Steps to transform a schema to use this pattern
- [FHIR Modeling Reference](./FHIR%20Modeling%20Reference.md) — Core modeling rules and conventions
- [Adding Resource Types How-To](./Adding%20Resource%20Types%20How-To.md) — End-to-end workflow for adding a Clinical Resource
