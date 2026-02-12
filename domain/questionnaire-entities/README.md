# @assessmentis/questionnaire-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package contains predefined questionnaire templates used by Assessment.is. It provides structured FHIR-compliant questionnaires for diagnostic assessments.

## What This Package Does

- Defines standardized questionnaire templates (DIVA-2, GAD-7, etc.)
- Provides type-safe questionnaire definitions based on FHIR Questionnaire resource
- Serves as the single source of truth for questionnaire structures

## Project Structure

```plaintext
src/
├── index.ts           # Exports all questionnaire templates
├── diva2.ts          # DIVA-2 ADHD assessment questionnaire
├── gad7.ts           # Generalized Anxiety Disorder 7-item scale
└── noItems.ts        # Test questionnaire with no items
```

## Usage

```typescript
import {
  diva2,
  gad7,
  questionnaireTemplates,
} from '@assessmentis/questionnaire-domain'

const adhd = diva2
const all = questionnaireTemplates
```

## Important Guidelines

### ✅ DO:

- Follow FHIR R4 Questionnaire specification strictly
- Add tests for new questionnaire templates (see `questionnaireTemplates.test.ts`)
- Ensure questionnaires have proper metadata (title, status, version)
- Validate questionnaires against FHIR schema before committing

### ❌ DON'T:

- Add UI or presentation logic (this is domain layer)
- Add database or API calls (use repositories in infrastructure layer)
- Hardcode patient or response data (templates only)
- Modify existing questionnaires without careful consideration (may break existing responses)

## Adding a New Questionnaire

1. Create a new file (e.g., `phq9.ts`)
2. Define the questionnaire following FHIR R4 spec
3. Add comprehensive tests
4. Export from `index.ts`
5. Add to `questionnaireTemplates` array

## Related Packages

- `@assessmentis/clinical-domain`: Core FHIR types
- `@assessmentis/document-domain`: Document generation using questionnaires
