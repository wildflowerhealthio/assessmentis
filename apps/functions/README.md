# @assessmentis/functions

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Firebase Cloud Functions for Assessment.is backend operations.

## What This Package Does

- Provides backend API endpoints via Cloud Functions
- Handles server-side operations
- Manages Daily.co video room creation
- Manages Google OAuth refresh tokens

## Project Structure

```plaintext
src/
├── index.ts           # Cloud Functions exports
└── ...                # Function implementations
```

## Development

### Local Development

```bash
# Build and run emulator
npm run serve

# Deploy to Firebase
npm run deploy
```

### Testing Locally

```bash
# Start Firebase emulator
npm run serve

# Check logs
npm run logs
```

## Important Guidelines

### ✅ DO:

- Use domain packages for business logic
- Use infrastructure packages for external services
- Handle errors appropriately
- Log important operations

### ❌ DON'T:

- Duplicate domain logic
- Expose sensitive data in responses

## Configuration

Use **environment variables** for process-level secrets (Whole platform API keys, tokens).

Use **config-domain and infrastructure** for organization-level configuration and keys.

## Deployment

Functions are deployed via Firebase CLI:

```bash
firebase deploy --only functions
```

## Related Packages

- `@assessmentis/clinical-domain`: Business logic
- `@assessmentis/google-fhir-web-infrastructure`: FHIR API client
- `@assessmentis/daily-co-infrastructure`: Video service client
