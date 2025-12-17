# @assessmentis/functions

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Firebase Cloud Functions for Assessment.is backend operations.

## What This Package Does

- Provides backend API endpoints via Cloud Functions
- Handles server-side operations
- Integrates with Google Cloud Healthcare API
- Manages Daily.co video room creation

## Project Structure

```
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
- Hardcode secrets (use environment variables)
- Expose sensitive data in responses

## Environment Variables

Configure Firebase Functions with required environment:

- Google Cloud Healthcare API credentials
- Daily.co API keys
- Other service configurations

## Deployment

Functions are deployed via Firebase CLI:

```bash
firebase deploy --only functions
```

## Related Packages

- `@assessmentis/clinical-domain`: Business logic
- `@assessmentis/google-fhir-infrastructure`: FHIR API client
- `@assessmentis/daily-co-infrastructure`: Video service client
