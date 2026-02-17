# Refactor: Separate FHIR R4 Schemas from Domain Types

**Branch**: `ruthmarks/refactor/seperate-fhir-from-data-types`

## Goal

Decouple `domain/clinical-domain` from FHIR R4 so it independently describes domain types. Copy FHIR transformation schemas to `domain/fhir-r4`.

## The Pattern

### In clinical-domain

Every schema gets restructured into a `const TypeName = { Schema: ... }` pattern. TS declaration merging lets the `interface` and `const` share the same name.

**Import rule**: When a module exports both `interface X` and `const X = { Schema: ... }`, import with a single `import { X }` — never separate `import type { X }` + `import { X }` (causes duplicate identifier errors).

### In fhir-r4

Copied schemas use a `FhirR4` prefix: `export const FhirR4Patient = { Schema: ... }`.

- **Why**: `import type { Patient }` + `export const Patient` causes TS2395/TS2440 — TypeScript doesn't merge imported types with local const declarations. The `FhirR4` prefix avoids the conflict entirely.
- **Type imports**: `import type { X, XEncoded } from '@assessmentis/clinical-domain/...'` — types come from clinical-domain, schemas from fhir-r4.
- **Internal refs**: Schema references within fhir-r4 use the prefixed names (e.g., `FhirR4Element.Schema`, `FhirR4Extension.Schema`).
- **Branded types** exported from clinical-domain (like `Code`, `EncounterId`) are imported directly — no need to duplicate.
- **File-local branded types** (like `NarrativeId`, `ElementId`) are re-defined locally in fhir-r4.

### Circularity gotcha — Encoded interfaces

When TypeScript can't infer a schema's type due to circular or self-referential const initializers, you must:

1. **Extract the schema** into a separate `const XSchema` variable
2. **Add an explicit type annotation** using `Schema.Schema<X, XEncoded, never>` (or `Schema.Schema<X, unknown, never>` when the encoded shape is complex)
3. **Assign it** inside the merged const: `export const X = { Schema: XSchema }`

This happens in these situations:
- **Mutual recursion** (Reference ↔ Identifier) — both consts reference each other via `Schema.suspend`
- **Self-referencing const** (CodeableConcept) — `Data.case<CodeableConcept>()` in the same initializer as the Schema
- **Const re-exported as schema** (Coding) — schema body extracted to `const CodingSchema` with `satisfies Schema.Schema<Coding, any, never>`
- **Recursive tree structures** (CompositionSection, QuestionnaireItem, QuestionnaireResponseItem) — `section?: CompositionSection[]` inside CompositionSection's own schema. Extract to `const CompositionSectionSchema: Schema.Schema<CompositionSection, unknown, never>` and use `Schema.suspend((): Schema.Schema<CompositionSection> => CompositionSectionSchema)` for the self-reference.
- **Mutually recursive items** (QuestionnaireResponseItem ↔ QuestionnaireResponseItemAnswer) — both reference each other via suspend. Extract both to separate consts with explicit annotations.

Some types also define explicit `*Encoded` interfaces (e.g., `AttachmentEncoded`, `ValueElementEncoded`, `ElementEncoded`, `ExtensionEncoded`) for the raw JSON shape before transforms like `Schema.DateTimeUtc` or branded IDs.

### Before → After examples

```typescript
// SIMPLE TYPE (e.g. Address — no circularity, no transforms)
// Before:
export const AddressFromFhirR4: Schema.Schema<Address, fhir.Address, never> = Schema.mutable(...)
// After (clinical-domain):
export const Address = { Schema: Schema.mutable(...) }
// After (fhir-r4):
export const FhirR4Address = { Schema: Schema.mutable(...) }

// GENERIC BASE TYPE (e.g. DomainResource)
// Before:
export const DomainResourceFromFhirR4 = <IdType>(idSchema) => Schema.extend(...)
// After (clinical-domain):
export const DomainResource = { Schema: <IdType>(idSchema) => Schema.extend(...) }
// After (fhir-r4):
export const FhirR4DomainResource = { Schema: <IdType>(idSchema) => Schema.extend(...) }
```

**Reference updates**: `CodingFromFhirR4` → `Coding.Schema` (in clinical-domain), or `FhirR4Coding.Schema` (in fhir-r4).

---

## Status: What's Done

### ✅ Step 1 — base, special-purpose, primitive data types (clinical-domain)

- `src/data-types/base/Element.ts` — `Element.Schema(idSchema)` + `ElementEncoded` interface
- `src/data-types/base/Resource.ts` — `Resource.Schema(idSchema)`
- `src/data-types/base/BackboneElement.ts` — `BackboneElement.Schema(idSchema)`
- `src/data-types/base/DomainResource.ts` — `DomainResource.Schema(idSchema)` + `Meta.Schema`
- `src/data-types/special-purpose/Extension.ts` — `Extension.Schema` + `ExtensionEncoded` + `createExtension` (unchanged)
- `src/data-types/special-purpose/Narrative.ts` — `Narrative.Schema`
- `src/data-types/primitive/ValueElement.ts` — `ValueElement.Schema` + `ValueElementEncoded` + `_valueCode` support

### ✅ Step 2 — complex data types (clinical-domain)

All in `src/data-types/complex/`:

- `Coding.ts` — extracted to `const CodingSchema` with `satisfies Schema.Schema<Coding, any, never>` + eslint-disable. `Code` brand unchanged.
- `CodeableConcept.ts` — `make` + `Schema` merged. Uses `Schema.suspend((): Schema.Schema<Coding> => Coding.Schema)` to break inference cycle.
- `Address.ts` — simple `Address = { Schema: ... }`
- `Annotation.ts` — `Annotation = { Schema: ... }`
- `Attachment.ts` — `Attachment = { Schema: ... }` + `AttachmentEncoded` interface defined (imports `ElementEncoded`)
- `ContactPoint.ts` — `ContactPoint = { Schema: ... }`
- `HumanName.ts` — `HumanName = { Schema: ... }`
- `IdentifierAndReference.ts` — extracted `const ReferenceSchema: Schema.Schema<Reference, unknown, never>` and `const SchemaIdentifier: Schema.Schema<Identifier, unknown, never>`. Both wrapped in `Reference = { Schema: ReferenceSchema }` / `Identifier = { Schema: SchemaIdentifier }`.
- `Period.ts` — `Period = { Schema: ... }`
- `Quantity.ts` — `Quantity = { Schema: ... }`
- `Range.ts` — `Range = { Schema: ... }`
- `functions.ts` — `ReferenceFromFhirR4` → `Reference.Schema`

### ✅ Step 3 — resource schemas in clinical-domain

**Administration** (`src/administration/resources/`):
- `Patient.ts` — `Patient = { Schema: ... }`. Sub-schemas renamed: `PatientContactSchema`, `PatientCommunicationSchema`, `PatientLinkSchema`.
- `Location.ts` — `Location = { Schema: ..., make: ..., isVirtualLocation: ... }`. Merged schema into existing const.
- `Encounter.ts` — `Encounter = { Schema: ... }`. Sub-schemas renamed: `EncounterStatusHistorySchema`, `EncounterClassHistorySchema`, `EncounterParticipantSchema`, `EncounterDiagnosisSchema`, `EncounterHospitalizationSchema`, `EncounterLocationSchema`.
- `Practitioner.ts` — `Practitioner = { Schema: ... }`. Sub-schema: `PractitionerQualificationSchema`.

**Content Management** (`src/content-management/resources/`):
- `Composition/Composition.ts` — `Composition = { Schema: ... }`.
- `Composition/CompositionAttester.ts` — `CompositionAttester = { Schema: ... }`.
- `Composition/CompositionEvent.ts` — `CompositionEvent = { Schema: ... }`.
- `Composition/CompositionRelatesTo.ts` — `CompositionRelatesTo = { Schema: ... }`.
- `Composition/CompositionSection.ts` — **Recursive**: extracted `const CompositionSectionSchema: Schema.Schema<CompositionSection, unknown, never>`. Self-references via `Schema.suspend((): Schema.Schema<CompositionSection> => CompositionSectionSchema)`.
- `Questionnaire/Questionnaire.ts` — `Questionnaire = { Schema: ... }`. **Recursive**: extracted `const QuestionnaireItemSchema: Schema.Schema<QuestionnaireItem, unknown, never>`, exported as `QuestionnaireItem = { Schema: QuestionnaireItemSchema }`.
- `QuestionnaireResponse/QuestionnaireResponseItem.ts` — **Mutually recursive**: extracted `QuestionnaireResponseItemAnswerSchema` and `QuestionnaireResponseItemSchema`, both with `Schema.Schema<..., unknown, never>` annotations.
- `QuestionnaireResponse/QuestionnaireResponse.ts` — `QuestionnaireResponse = { make: ..., Schema: ... }`. Merged schema into existing const.

**Diagnostic Medicine** (`src/diagnostic-medicine/resources/`):
- `Observation.ts` — `Observation = { Schema: ... }`. Sub-schemas: `ObservationReferenceRangeSchema`, `ObservationComponentSchema`.
- `Media.ts` — `Media = { make: ..., makeWithId: ..., Schema: ... }`. Merged schema into existing const.
- `DiagnosticReport.ts` — `DiagnosticReport = { Schema: ... }`. Sub-schema: `DiagnosticReportMediaSchema`.

**Foundation Framework** (`src/foundation-framework/resources/`):
- `Bundle.ts` — `Bundle = { Schema: <T>(contentTypeSchema) => ... }`. Generic function preserved. Helper `BundleEntrySchema` renamed from `BundleEntry`.

### ✅ Step 4 — Update downstream references

- `src/Schemas.ts` — imports updated to use `X.Schema` pattern.
- `src/assessmentis/index.ts` — dead import to deleted `makeClinicalDataRepository` removed.
- `domain/questionnaire-entities` — 3 files updated: `QuestionnaireFromFhirR4` → `Questionnaire.Schema`, `QuestionnaireResponseFromFhirR4` → `QuestionnaireResponse.Schema`, `QuestionnaireResponseItemFromFhirR4` → `QuestionnaireResponseItem.Schema`.
- `apps/frontend` — 6 files updated:
  - 3 story files: `QuestionnaireItemFromFhirR4` → `QuestionnaireItem.Schema`
  - `createEncounter.ts`: `EncounterFromFhirR4` → `Encounter.Schema`, `QuestionnaireResponseFromFhirR4` → `QuestionnaireResponse.Schema`
  - `QuestionnaireResponse.$questionnaireResponseId.tsx`: all `*FromFhirR4` → `*.Schema`

**Not yet updated** (blocked on `makeClinicalDataRepository` removal — being replaced separately):
- `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts`
- `apps/functions/src/effects/syncVideoCallRecordingsEffect.ts`

### ✅ Step 5 (in progress) — Copy schemas to `domain/fhir-r4`

**Infrastructure done:**
- `package.json` — added `@assessmentis/clinical-domain` and `@types/fhir` as dependencies, added subpath exports.
- Directory structure created mirroring clinical-domain.

**Base + special-purpose + primitive data-type schemas done** (7 files):
- `src/data-types/base/Element.ts` — `FhirR4Element.Schema(idSchema)`
- `src/data-types/base/Resource.ts` — `FhirR4Resource.Schema(idSchema)`
- `src/data-types/base/BackboneElement.ts` — `FhirR4BackboneElement.Schema(idSchema)`
- `src/data-types/base/DomainResource.ts` — `FhirR4DomainResource.Schema(idSchema)` + `FhirR4Meta.Schema`
- `src/data-types/special-purpose/Extension.ts` — `FhirR4Extension.Schema`
- `src/data-types/special-purpose/Narrative.ts` — `FhirR4Narrative.Schema`
- `src/data-types/primitive/ValueElement.ts` — `FhirR4ValueElement.Schema`

---

## Status: What Remains

### Step 5 (continued): Copy complex data-type schemas to fhir-r4

Files to create in `domain/fhir-r4/src/data-types/complex/`:

- `Coding.ts` — `FhirR4Coding.Schema`. Has circularity with CodeableConcept — extract to `const FhirR4CodingSchema` with explicit annotation. Import `Code`, `CodingEncoded` types from clinical-domain.
- `CodeableConcept.ts` — `FhirR4CodeableConcept.Schema`. Import `CodeableConceptEncoded` from clinical-domain. Uses `Schema.suspend` for Coding reference.
- `Address.ts` — `FhirR4Address.Schema`. Simple.
- `Annotation.ts` — `FhirR4Annotation.Schema`. Simple.
- `Attachment.ts` — `FhirR4Attachment.Schema`. Import `AttachmentEncoded` from clinical-domain.
- `ContactPoint.ts` — `FhirR4ContactPoint.Schema`. Simple.
- `HumanName.ts` — `FhirR4HumanName.Schema`. Simple.
- `IdentifierAndReference.ts` — `FhirR4Reference.Schema`, `FhirR4Identifier.Schema`. Mutual recursion — extract to separate consts with annotations. Import `ReferenceEncoded` from clinical-domain.
- `Period.ts` — `FhirR4Period.Schema`. Simple.
- `Quantity.ts` — `FhirR4Quantity.Schema`. Simple.
- `Range.ts` — `FhirR4Range.Schema`. Simple.

### Step 5 (continued): Copy resource schemas to fhir-r4

Mirror the same structure. Each file imports branded IDs + interfaces from clinical-domain, references fhir-r4's own data-type schemas.

**Administration** (`src/administration/resources/`):
- `Patient.ts` — `FhirR4Patient`
- `Location.ts` — `FhirR4Location`
- `Encounter.ts` — `FhirR4Encounter`
- `Practitioner.ts` — `FhirR4Practitioner`

**Content Management** (`src/content-management/resources/`):
- `Composition/*.ts` — `FhirR4Composition`, `FhirR4CompositionAttester`, `FhirR4CompositionEvent`, `FhirR4CompositionRelatesTo`, `FhirR4CompositionSection`
- `Questionnaire/Questionnaire.ts` — `FhirR4Questionnaire`, `FhirR4QuestionnaireItem`
- `QuestionnaireResponse/*.ts` — `FhirR4QuestionnaireResponse`, `FhirR4QuestionnaireResponseItem`

**Diagnostic Medicine** (`src/diagnostic-medicine/resources/`):
- `Observation.ts` — `FhirR4Observation`
- `Media.ts` — `FhirR4Media`
- `DiagnosticReport.ts` — `FhirR4DiagnosticReport`

**Foundation Framework** (`src/foundation-framework/resources/`):
- `Bundle.ts` — `FhirR4Bundle`

### Step 5 (continued): Barrel files + index exports

Create `index.ts` for each directory in fhir-r4, mirroring clinical-domain. Add re-exports for the `FhirR4*` schemas.

### Step 6: Update remaining downstream consumers

Once fhir-r4 schemas exist, update the two blocked files:
- `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts` — import schemas from `@assessmentis/fhir-r4/...`
- `apps/functions/src/effects/syncVideoCallRecordingsEffect.ts` — import schemas from `@assessmentis/fhir-r4/...`
- Both need `makeClinicalDataRepository` replacement (separate effort).

### Step 7: Verify

- `npm run typecheck`
- `npm run test`
- Verify no `import ... from 'fhir/r4'` in clinical-domain (except `FhirResourceDataTypes.ts` for now)
- Verify no `*FromFhirR4` names in clinical-domain exports
- Verify no `FromFhirR4` references outside fhir-r4 (except `FhirResourceDataTypes.ts`)
