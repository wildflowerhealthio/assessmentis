# @assessmentis/clinical-domain

> See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.

## Overview

Core domain package containing all clinical resource schemas, data types, and the `ClinicalDomainHub` service tag. This package is pure -- no side effects, no HTTP, no I/O.

See [FHIR Modeling Reference](docs/FHIR%20Modeling%20Reference.md) for schema conventions and modeling rules.
See [Adding Resource Types How-To](docs/Adding%20Resource%20Types%20How-To.md) for the step-by-step resource workflow.

## Project Structure

```plaintext
src/
├── index.ts                # Main exports
├── ResourceDataTypes.ts    # Registry mapping DomainType strings to Schema classes
├── ClinicalDomainHub.ts    # Hub service tag (via @assessmentis/effectful-store)
├── types.ts                # Shared type utilities
├── data-types/
│   ├── base/               # Element, BackboneElement, Resource, Meta
│   ├── complex/            # CodeableConcept, Coding, HumanName, Quantity, Period, etc.
│   ├── special-purpose/    # Extension, Narrative, StructureDefinition
│   ├── Datatype.ts         # Datatype + DatatypeChoice for value[x] unions
│   └── fhirR4ChoiceElements.ts
└── resources/
    ├── Bundle/
    ├── Composition/
    ├── DiagnosticReport/
    ├── Encounter/
    ├── Location/
    ├── Media/
    ├── Observation/
    ├── Patient/
    ├── Practitioner/
    ├── Questionnaire/
    └── QuestionnaireResponse/
```

## Usage

Resource access goes through the `ClinicalDomainHub`, which implements the Hub pattern from `@assessmentis/effectful-store`. The Hub provides get, search, create, update, delete, and reactive subscriptions for all registered resource types.

```typescript
import { ClinicalDomainHub, Patient, Encounter } from '@assessmentis/clinical-domain'
import { Effect } from 'effect'

const program = Effect.gen(function* () {
  const hub = yield* ClinicalDomainHub

  const patient = yield* hub.get(Patient, patientUrl)
  const encounters = yield* hub.search(Encounter, { patient: patientUrl })
})
```

All resource schemas are registered in `ResourceDataTypes.ts`, which maps each `DomainType` string literal to its Schema class constructor.

## Guidelines

**DO:**

- Use Effect Schema for all resource definitions
- Use branded types for Urls (e.g., `PatientUrl`)
- Write property tests for schemas (round-trip encode/decode)
- Use `DateTime.Utc` for instants, `TimelessDateFromString` for date-only fields

**DON'T:**

- Add infrastructure implementations (those belong in infrastructure packages)
- Add HTTP/API calls or side effects
- Bypass Effect Schema validation

## Docs

- [FHIR Modeling Reference](docs/FHIR%20Modeling%20Reference.md) -- Schema conventions, choice elements, base type factories
- [FHIR Schemas Explanation](docs/FHIR%20Schemas%20Explanation.md) -- Why the schema transformation pattern works this way
- [FHIR Schemas How-To](docs/FHIR%20Schemas%20How-To.md) -- Working with FHIR schemas
- [Adding Resource Types How-To](docs/Adding%20Resource%20Types%20How-To.md) -- Step-by-step new resource workflow

## Related Packages

- `@assessmentis/effectful-store` -- Hub pattern, Origin, Resource abstractions
- `@assessmentis/ontology` -- Domain error types used in this package
- `@assessmentis/fhir-r4` -- FHIR R4 transport-layer schemas and client
- `@assessmentis/questionnaire-entities` -- Questionnaire templates and scoring
- `@assessmentis/video-call-domain` -- Video call models (uses Encounter, Media)
