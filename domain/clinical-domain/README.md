# @assessmentis/clinical-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This is the **core domain package** for Assessment.is, containing all FHIR-based clinical models, schemas, and repository interfaces. This package is the foundation of the entire application's data model.

## What This Package Does

- Define FHIR R4 resource types and schemas
- Provide repository interfaces for data access
- Model clinical entities (Encounters, Questionnaires, QuestionnaireResponses, etc.)
- Define validation rules for clinical data

## Project Structure

```plaintext
src/
├── index.ts                   # Main exports
├── administration/            # Encounter resource and repository
├── content-management/        # Questionnaire & Response resources
├── data-types/                # Base FHIR types (Element, Resource, etc.)
├── diagnostic-medicine/       # Diagnostic assessment models
├── foundation-framework/      # FHIR foundation types
└── assessmentis/              # Assessment.is specific models
```

## Usage

```typescript
import {
  Questionnaire,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { Effect } from 'effect'

Effect.gen(function* () {
  const repo = yield* QuestionnaireRepository
  return yield* repo.get(id)
})
```

## Important Guidelines

### ✅ DO:

- **Follow FHIR R4 specification strictly** (verify against spec)
- Use Effect Schema for all resource definitions
- Define repository interfaces as Effect Tags
- Use branded types for IDs (e.g., `QuestionnaireId`)
- Write comprehensive tests for schemas
- **Use Effect's `DateTime.Utc`** rather than JavaScript Date for instants/times within the system
- Add models, schemas, types, pure functions, and business logic

### ❌ DON'T:

- Deviate from FHIR specification
- Add infrastructure implementations (use infrastructure packages)
- Add specific HTTP/API calls
- Add scoring algorithms or document generation (use document-domain)
- Bypass Effect Schema validation

## FHIR Resources Modeled

- Questionnaire & QuestionnaireResponse
- Encounter
- Composition
- General-purpose types (Element, Resource, Reference, etc.)
- Observation, Media, DiagnosticReport

## Repository Pattern

Repositories are defined as Effect Tags:

```typescript
export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  {
    get: (
      id: QuestionnaireId
    ) => Effect.Effect<Questionnaire, NotFoundError, never>
  }
>() {}
```

Implementations are in infrastructure packages (e.g., `@assessmentis/google-fhir-web-infrastructure`).

## FHIR Extensions

Custom extensions follow this pattern:

```typescript
{
  url: 'http://assessment.is/fhir/extension-name',
  valueString: 'value' // or other value[x] types
}
```

## Related Packages

- `@assessmentis/ontology`: Domain errors used in this package
- `@assessmentis/google-fhir-web-infrastructure`: Repository implementations
- `@assessmentis/questionnaire-domain`: Questionnaire templates
- `@assessmentis/document-domain`: Document generation
- `@assessmentis/video-call-domain`: Video call models (uses Encounter, Media)
