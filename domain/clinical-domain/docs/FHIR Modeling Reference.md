# FHIR Modeling Reference

This reference documents how FHIR R4 resources are modeled in clinical-domain.

For step-by-step Clinical Resource implementation, see [Adding Resource Types How-To.md](./Adding%20Resource%20Types%20How-To.md). For understanding the schema transformation pattern, see [FHIR Schemas Explanation.md](./FHIR%20Schemas%20Explanation.md).

## Core modeling rules

- Use Effect Schema for all resource modeling.
- Every resource must include resourceType as a literal.
- Model identifiers as branded Schema types (for example PatientId).
- Extend Resource or Resource for base fields.
- Use Schema.suspend for recursive types and references.
- Prefer value sets under value-sets/ for constrained coded values.
- Use TimelessDateFromString for date-only fields when applicable.
- Use Schema.DateTimeUtc for instants and timestamps.
- Resource ids are optional on create but required on read/update results; use WithId + assertId where needed.

## Choice elements (value\[x\])

FHIR R4 uses choice elements where a field can hold one of several data types, discriminated by the field name suffix (e.g., `valueString`, `valueCoding`, `valueQuantity`). Only ONE value\[x\] field may be present at a time.

Each resource defines its own allowed types. The definitive list is in `src/data-types/fhir-r4-choice-elements.json` (from `https://hl7.org/fhir/R4/choice-elements.json`).

- Model choice elements as `Datatype<Name, A, I>` instances (see `src/data-types/Datatype.ts`).
- Compose into `ValueUnion(...)` to produce a `Schema.Union` of single-field structs.
- Each union branch is `{ value${Name}: schema }` — enforces exactly-one-value at the type level.
- Use `Schema.extend(baseStruct, valueUnion)` to combine base fields with the value union.

```typescript
// Per FHIR R4: Observation.value[x]
const ObservationValue = ValueUnion(
  QuantityDatatype,
  CodeableConceptDatatype,
  StringDatatype,
  BooleanDatatype,
  IntegerDatatype,
  RangeDatatype,
  TimeDatatype,
  DateTimeDatatype,
  PeriodDatatype
)
```

Complex types export their own `Datatype` alongside themselves (e.g., `CodingDatatype` from `Coding.ts`). Primitive datatypes live in `Datatype.ts`.

## Base type factories (Element, BackboneElement, Resource)

Each base type is a generic factory function that returns a `Schema.Class` subclass with statics:

```typescript
// Element(domainType) → Schema.Class with static DomainType, UrlSchema
const ElementMixin = Element('Patient')
// BackboneElement(domainType) → Schema.Class composed with Element via MergeClasses
const BackboneMixin = BackboneElement('PatientContact')
// Resource(domainType) → Schema.Class with all Resource fields
const ResourceMixin = Resource('Patient')
```

Consumer pattern — pass the mixin and fields to `MergeClasses`:

```typescript
export class Patient extends MergeClasses<Patient>('Patient')(
  Resource('Patient'),
  patientFields
) {}
```

The factory function and a same-name type alias coexist (TypeScript declaration merging): `Element<'Patient'>` gives the decoded type, `Element('Patient')` gives the mixin class.

Extension is a special case — defined in `ElementAndExtension.ts` to break circular imports. It uses `MergeClasses` to compose Element fields with DatatypeChoice value[x] fields.

## Schema structure conventions

- Base types live under data-types/base/ (Element, BackboneElement, Resource).
- Resource-specific schemas live under resources/ organized by resource.
- Shared complex types live under data-types/complex and data-types/special-purpose.
- Datatype definitions for choice elements live in data-types/Datatype.ts (primitives) and alongside their complex type files.
- Register all resource schemas in Schemas.ts for repository wiring.

## TypeScript gotchas

### Declaration merging imports

When a module exports both `interface Foo` and `const Foo` (via TS declaration merging), use a **single** `import { Foo }`. Never write separate `import type { Foo }` and `import { Foo }` — TypeScript treats these as duplicate identifiers.

```typescript
// GOOD
import { Element } from '../base/Element'

// BAD — duplicate identifier error
import type { Element } from '../base/Element'
import { Element } from '../base/Element'
```

### Effect Schema `suspend` for circular deps

When schemas reference each other circularly (e.g., Reference <-> Identifier), wrap the reference in `Schema.suspend(() => ...)`. This delays evaluation and breaks the cycle.

**Important**: `Schema.suspend` only breaks cycles at _schema evaluation time_, NOT at _module load time_. If module A imports module B (value import), and B imports A, the circular import still causes Vite SSR to see `undefined` exports. `Schema.suspend` helps when both schemas are in the same file or when the import chain is acyclic. For cross-file cycles, restructure imports (co-locate in one file like `IdentifierAndReference.ts`, or eliminate the cycle).

### Circular const initializers need explicit type annotations

When you merge an `interface X` and `const X = { Schema: ... }` via declaration merging, TypeScript sometimes can't infer the const's type — it reports `'X' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer`. This happens when:

- **Mutual recursion**: two consts reference each other via `Schema.suspend` (e.g., Reference <-> Identifier)
- **Self-referencing initializer**: the const references itself via a generic like `Data.case<X>()` alongside a complex Schema expression
- **Suspend callbacks returning the same const**: `Schema.suspend(() => X.Schema)` inside `X`'s own initializer

The fix: **extract the schema into a separate const with an explicit type annotation**, then assign it:

```typescript
// Extract with annotation to break the cycle
const ReferenceSchema: Schema.Schema<Reference, unknown, never> = Schema.extend(...)
export const Reference = { Schema: ReferenceSchema }

// Or use a return-type annotation on the suspend callback
Schema.suspend((): Schema.Schema<Coding> => Coding.Schema)

// Or use `satisfies` when you don't want to specify the encoded type
const CodingSchema = Schema.mutable(...) satisfies Schema.Schema<Coding, any, never>
```

Don't naively drop type annotations during a refactor without checking for circularity first — the old annotations were often the thing breaking the inference cycle.

## Testing expectations

- Add property tests for schemas and round-trip encode/decode.
- Keep test files alongside resource files.
- Prefer Effect Schema Arbitrary and fast-check for property coverage.

## Most-used code locations

- Resource base types: [src/data-types/base](../src/data-types/base)
- Datatype and ValueUnion: [src/data-types/Datatype.ts](../src/data-types/Datatype.ts)
- FHIR R4 choice elements: [src/data-types/fhirR4ChoiceElements.ts](../src/data-types/fhirR4ChoiceElements.ts)
- Example resource: [src/resources/Patient](../src/resources/Patient)
- Clinical Resource How-To: [Adding Resource Types How-To.md](./Adding%20Resource%20Types%20How-To.md)
- Resource registry: [src/Schemas.ts](../src/Schemas.ts)
- Resource tests: alongside resource files in src/resources/
