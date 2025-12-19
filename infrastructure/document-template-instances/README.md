# @assessmentis/document-template-instances

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package provides React-based document templates for rendering assessment documents. It transforms document models from document-domain into visual React components for display or PDF generation.

## What This Package Does

- Render document models as React components
- Provide styled templates for different document types
- Enable document preview and PDF generation

## Project Structure

```
src/
├── index.ts           # Main exports
└── plain/
    └── gad7.tsx      # Plain text GAD-7 report template
```

## Usage

```typescript
import { PlainGad7Report } from '@assessmentis/document-template-instances'

function DisplayReport({ document }) {
  return <PlainGad7Report document={document} />
}
```

## Important Guidelines

### ✅ DO:

- Accept document models from document-domain as props
- Use semantic HTML for accessibility
- Keep components pure and stateless

### ❌ DON'T:

- Add business logic or calculations (use document-domain)
- Fetch data or make API calls
- Modify or transform the document data
- Use heavy CSS-in-JS libraries

## Adding a Document Template

1. Create a new component file (e.g., `plain/phq9.tsx`)
2. Accept document model from document-domain as props
3. Focus on clear, readable layout
4. Export from `index.ts`

## Related Packages

- `@assessmentis/document-domain`: Provides document models
- `apps/frontend`: Consumes these components
