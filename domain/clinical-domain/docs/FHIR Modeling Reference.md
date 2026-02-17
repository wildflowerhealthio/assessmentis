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

When schemas reference each other circularly (e.g., Element <-> Extension), wrap the reference in `Schema.suspend(() => ...)`. This delays evaluation and breaks the cycle.

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

- Resource base types: [src/data-types/base](src/data-types/base)
- DomainResource base: [src/data-types/base/DomainResource.ts](src/data-types/base/DomainResource.ts)
- Example resource: [src/administration/resources/Patient.ts](src/administration/resources/Patient.ts)
- Clinical Resource How-To: [docs/Adding Resource Types How-To.md](./docs/Adding%20Resource%20Types%20How-To.md)
- Resource registry: [src/Schemas.ts](src/Schemas.ts)
- Repository factory: [src/assessmentis/makeClinicalDataRepository.ts](src/assessmentis/makeClinicalDataRepository.ts)
- Resource tests: [src/administration/resources](src/administration/resources)
