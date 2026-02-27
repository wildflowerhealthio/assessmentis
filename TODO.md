# TODO: Resolve fhir-r4 type errors after clinical-domain refactor

## Context
Branch: `ruthmarks/refactor/seperate-fhir-from-data-types`

Big refactor separating FHIR R4 concerns from clinical-domain data types. The clinical-domain now has its own Element/Schema class hierarchy, and fhir-r4 schemas need to map between `FhirR4.*` types and the domain's `*Encoded` types, then compose with the domain class for the full decode.

## What was done

### Pattern established for Element-based complex data types

Each file follows a two-level pattern:

1. **`*EncodedFromFhir`** (exported): `Schema.Schema<DomainEncoded, FhirR4.Type, BaseUrl>` — maps FHIR wire format to the domain's Encoded type using `Schema.extend(ElementIdentification(key), mutableEncoded(Schema.Struct({...})))`
2. **Full schema**: `Schema.compose(EncodedFromFhir, DomainClass)` — composes for full FHIR→Domain decode

Key rules:
- `ElementIdentification` takes **1 arg** (domain type key only)
- All struct fields use **raw encoded types** (`Schema.String` not `Code`, `Schema.String` not `Schema.DateTimeUtc`) — the domain class handles decoding
- **Exception**: enum/literal union fields must use the narrow union (not `Schema.String`) to match the Encoded type (see `IdentifierUse`)
- Nested complex types reference the `*EncodedFromFhir` variant via `Schema.suspend()`
- Namespace imports (e.g. `Coding` from `export * as Coding`) → access class as `Coding.Coding`, encoded as `Coding.CodingEncoded`
- Directly exported types (e.g. `Quantity`, `CodeableConcept`) → use class name directly

### Files completed (data-types/complex/)
- **Coding.ts** — split into `CodingEncodedFromFhir` + full schema
- **Period.ts** — split into `PeriodEncodedFromFhir` + full schema
- **Quantity.ts** — split into `QuantityEncodedFromFhir` + full schema
- **Attachment.ts** — uses `Schema.fromKey('url')` for `dataUrl` rename
- **CodeableConcept.ts** — references `CodingEncodedFromFhir`, `ExtensionEncodedFromFhir`
- **Range.ts** — references `QuantityEncodedFromFhir`
- **IdentifierAndReference.ts** — circular Reference/Identifier with `Schema.suspend`, literal union for `use`
- **Annotation.ts** — references `ReferenceEncodedFromFhir`

### Files done by user (check these for accuracy)
- **CodeableConcept.ts** and **Coding.ts** were tweaked by the user after initial agent work
- **UrlIdentification.ts** — user simplified `ElementIdentification` to 1 arg
- **clinical-domain CodeableConcept.ts** — user made changes

## What remains

### Priority: Check user's recent work
**The next agent should read and verify the latest state of files the user edited most recently** — particularly `CodeableConcept.ts`, `Coding.ts`, `IdentifierAndReference.ts`, and `UrlIdentification.ts`. The user may have made further tweaks not captured here.

### data-types/ — still has errors
- **Address.ts** — `line` field is required (`Schema.Array`) in domain but optional in FHIR. Design decision needed.
- **ContactPoint.ts** — namespace-as-type error (`ContactPoint` → `ContactPoint.Type` or `ContactPoint.ContactPoint`), context `never` → `BaseUrl` (from Period)
- **HumanName.ts** — same pattern as ContactPoint
- **base/Element.ts, Resource.ts, BackboneElement.ts, DomainResource.ts** — base types have import issues (`Type`, `Fields`, `DomainResource` no longer exported). These may no longer be needed for data-types (since `ElementIdentification` replaced `FhirR4Element.Schema()`), but they're still used by resource schemas.
- **primitive/ValueElement.ts** — imports `Type` and `Encoded` which no longer exist in clinical-domain
- **special-purpose/Extension.ts** — duplicate `AllDatatypeKeys` import

### Resources — not started
All resource files have errors (administration/, content-management/, diagnostic-medicine/, foundation-framework/). These use `FhirR4DomainResource` and the base types which need fixing first.

### Other
- **FhirR4ResourceBehaviour.ts** — 2 errors
- **UrlIdentification.ts** line 67 — `resourceType` reference in `ElementIdentification.encode` callback (was removed when second param was dropped)

## Decisions needed from user
1. **Address.line**: Required in domain, optional in FHIR — should the FHIR schema default to `[]`? Or should the domain make it optional?
2. **ContactPoint/HumanName**: These are non-Element types. Do they need the compose pattern, or just a struct with updated type annotations?
3. **Base types**: Are `FhirR4Element`, `FhirR4BackboneElement`, `FhirR4Resource`, `FhirR4DomainResource` still needed? Or should resource schemas use a different pattern?
