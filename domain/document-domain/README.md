# @assessmentis/document-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package defines document generation logic and models for Assessment.is. It transforms questionnaire responses into structured documents with calculated scores and summaries.

## What This Package Does

- Transform FHIR QuestionnaireResponse into document models
- Calculate assessment scores (e.g., GAD-7 total score)
- Provide pure business logic for document generation
- Validate and handle incomplete responses

## Project Structure

```
src/
├── index.ts           # Main exports
├── gad7.ts           # GAD-7 document generation and scoring
├── gad7.test.ts      # Tests for GAD-7 logic
└── utility/          # Shared utilities for document generation
```

## Usage

```typescript
import { generateGad7Document } from '@assessmentis/document-domain'
import { Effect } from 'effect'

const effect = generateGad7Document(questionnaireResponse)
const document = await Effect.runPromise(effect)
```

## Important Guidelines

### ✅ DO:

- Write comprehensive tests for scoring algorithms (critical!)
- Document scoring algorithms with references to clinical specifications
- Handle missing or incomplete responses gracefully
- Keep transformations pure (no side effects)

### ❌ DON'T:

- Add UI components (use jsx-document-infrastructure for rendering)
- Add database or API calls (pure domain logic only)
- Mutate input data
- Hardcode patient or provider information

## Related Packages

- `@assessmentis/questionnaire-domain`: Source questionnaires
- `@assessmentis/jsx-document-infrastructure`: React-based rendering
- `@assessmentis/clinical-domain`: Core FHIR types
