# @assessmentis/clinical-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This is the **core domain package** for Assessment.is, containing all FHIR-based clinical models, schemas, and repository interfaces. This package is the foundation of the entire application's data model.

## What This Package Does

- Define FHIR R4 resource types and schemas
- Provide repository interfaces for data access
- Model clinical entities (Encounters, Questionnaires, QuestionnaireResponses, etc.)
- Define domain errors and validation rules

## Project Structure

```
src/
├── index.ts                   # Main exports
├── errors.ts                  # Domain-specific errors
├── general-purpose/           # Base FHIR types (Element, Resource, etc.)
├── encounters/                # Encounter resource and repository
├── questionnaires/            # Questionnaire & Response resources
├── video-calls/               # Video call domain models
├── compositions/              # FHIR Composition resources
└── diagnostic-medicine/       # Diagnostic assessment models
```

## Usage

```typescript
import { Questionnaire, QuestionnaireRepository } from '@assessmentis/clinical-domain/questionnaires'
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

### ❌ DON'T:

- Deviate from FHIR specification
- Add infrastructure implementations (use infrastructure packages)
- Add HTTP/API calls (repositories are interfaces only)
- Add scoring or calculation logic (use document-domain)
- Bypass Effect Schema validation

## FHIR Resources Modeled

- Questionnaire & QuestionnaireResponse
- Encounter
- Composition
- General-purpose types (Element, Resource, Reference, etc.)
- Video call domain models

## Repository Pattern

Repositories are defined as Effect Tags:

```typescript
export class QuestionnaireRepository extends Context.Tag('QuestionnaireRepository')<
  QuestionnaireRepository,
  {
    get: (id: QuestionnaireId) => Effect.Effect<Questionnaire, NotFoundError, never>
  }
>() {}
```

Implementations are in infrastructure packages (e.g., `@assessmentis/google-fhir-infrastructure`).

## FHIR Extensions

Custom extensions follow this pattern:

```typescript
{
  url: 'http://assessment.is/fhir/extension-name',
  valueString: 'value' // or other value[x] types
}
```

## Related Packages

- `@assessmentis/google-fhir-infrastructure`: Repository implementations
- `@assessmentis/questionnaire-domain`: Questionnaire templates
- `@assessmentis/document-domain`: Document generation

**Note**: This is the **most critical** package in the monorepo. All changes must maintain FHIR R4 compliance and have comprehensive test coverage. When in doubt, consult: https://www.hl7.org/fhir/
