# FHIR Schemas How-To

How to transform a FHIR resource schema to use the explicit field transformation pattern.

For background on why this pattern exists, see [FHIR Schemas Explanation](./FHIR%20Schemas%20Explanation.md).

## 1. Identify fields that need transformation

Look at your resource's type parameter. If it's currently:

```typescript
const MyResourceFromFhirR4 = Schema.Struct({
  // ... fields
})
  .annotations({ identifier: 'MyResourceFromFhirR4' })
  .pipe(
    Schema.extend(Resource(MyResourceId)),
    Schema.compose(
      Schema.typeSchema(Schema.Unknown) as Schema.Schema<
        MyResource,
        DeepReadonly<FhirMyResource>
      >
    )
  )
```

Find complex FHIR types in your resource definition that have corresponding `FromFhirR4` schemas:

- Identifier → `IdentifierFromFhirR4`
- CodeableConcept → `CodeableConceptFromFhirR4`
- Reference → `ReferenceFromFhirR4`
- Period → `PeriodFromFhirR4`
- Quantity, SimpleQuantity → `QuantityFromFhirR4`
- Annotation → `AnnotationFromFhirR4`
- Attachment → `AttachmentFromFhirR4`
- Range → `RangeFromFhirR4`
- HumanName → `HumanNameFromFhirR4`
- ContactPoint → `ContactPointFromFhirR4`
- Address → `AddressFromFhirR4`

## 2. Transform the type parameter

Replace `DeepReadonly<FhirMyResource>` with the Omit + intersection pattern:

```typescript
Schema.compose(
  Schema.typeSchema(Schema.Unknown) as Schema.Schema<
    MyResource,
    DeepReadonly<
      Omit<
        AsDefinedFhirDomainResource<FhirMyResource>,
        'identifier' | 'period'
      > & {
        identifier?: typeof IdentifierFromFhirR4.Encoded
        period?: typeof PeriodFromFhirR4.Encoded
      }
    >
  >
)
```

For array fields, wrap the `.Encoded` type:

```typescript
identifier?: ReadonlyArray<typeof IdentifierFromFhirR4.Encoded>
```

For optional fields, use `?:`. For required fields, use `:`.

## 3. Handle BackboneElement sub-components

If your resource has nested BackboneElement structures (like `Patient.contact` or `Encounter.participant`), each needs its own transformation:

```typescript
const PatientContactFromFhirR4 = Schema.Struct({
  // ... fields
}).pipe(
  Schema.extend(BackboneElement),
  Schema.compose(
    Schema.typeSchema(Schema.Unknown) as Schema.Schema<
      PatientContact,
      DeepReadonly<
        Omit<
          AsDefinedFhirBackboneElement<FhirPatientContact>,
          'relationship' | 'name'
        > & {
          relationship?: ReadonlyArray<typeof CodeableConceptFromFhirR4.Encoded>
          name?: typeof HumanNameFromFhirR4.Encoded
        }
      >
    >
  )
)
```

Use `AsDefinedFhirBackboneElement<T>` for BackboneElements instead of `AsDefinedFhirDomainResource<T>`.

## 4. Import the FromFhirR4 schemas

Add imports at the top of your file:

```typescript
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept.js'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference.js'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period.js'

// ... etc
```

## 5. Verify type safety

TypeScript should confirm that:

- The `.Encoded` types match the FHIR field types
- The Omit removes exactly the fields you're re-declaring
- No fields are declared twice (once in Omit, once in the intersection)

If TypeScript shows errors, check:

- Are you using the right `FromFhirR4` schema for each field?
- Did you wrap array fields in `ReadonlyArray<...>`?
- Did you use `AsDefinedFhirDomainResource` vs `AsDefinedFhirBackboneElement` correctly?

## 6. Update tests

Your encode/decode round-trip property tests should continue passing. If they fail, check:

- Does the Arbitrary generator produce valid FHIR data for the new type signature?
- Are all required fields present in the test data?

## Examples

**Simple resource (one field):**

```typescript
// DiagnosticReport has only identifier that needs transformation
DeepReadonly<
  Omit<AsDefinedFhirDomainResource<FhirDiagnosticReport>, 'identifier'> & {
    identifier?: typeof IdentifierFromFhirR4.Encoded
  }
>
```

**Complex resource (many fields):**

```typescript
// Patient has 12 fields that need transformation
DeepReadonly<
  Omit<
    AsDefinedFhirDomainResource<FhirPatient>,
    | 'identifier'
    | 'name'
    | 'telecom'
    | 'address'
    | 'maritalStatus'
    | 'photo'
    | 'contact'
    | 'communication'
    | 'generalPractitioner'
    | 'managingOrganization'
    | 'link'
  > & {
    identifier?: ReadonlyArray<typeof IdentifierFromFhirR4.Encoded>
    name?: ReadonlyArray<typeof HumanNameFromFhirR4.Encoded>
    telecom?: ReadonlyArray<typeof ContactPointFromFhirR4.Encoded>
    // ... etc
  }
>
```

## Most-used code locations

- Example schemas: [../src/resources/Patient/Patient.ts](../src/resources/Patient/Patient.ts), [../src/resources/Observation/Observation.ts](../src/resources/Observation/Observation.ts)
- FromFhirR4 schemas: [../src/data-types/complex/](../src/data-types/complex/)
- Base type definitions: [../src/data-types/base/Resource.ts](../src/data-types/base/Resource.ts), [../src/data-types/base/BackboneElement.ts](../src/data-types/base/BackboneElement.ts), and [../src/data-types/base/Element.ts](../src/data-types/base/Element.ts)
