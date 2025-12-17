# @assessmentis/google-fhir-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Infrastructure package providing Google Cloud Healthcare API integration for FHIR data persistence.

## What This Package Does

- Implements repository interfaces from clinical-domain
- Integrates with Google Cloud Healthcare FHIR API
- Handles FHIR resource CRUD operations
- Manages authentication with Google Cloud

## Important Guidelines

### ✅ DO:

- Implement all repository interfaces from clinical-domain
- Use Effect Layers for dependency injection
- Handle Google Cloud API errors appropriately
- Validate FHIR resources before sending to API
- Use proper authentication mechanisms

### ❌ DON'T:

- Add domain logic (use clinical-domain)
- Bypass domain repositories
- Hardcode credentials or project IDs
- Transform FHIR data without using domain schemas

## Related Packages

- `@assessmentis/clinical-domain`: Defines repository interfaces
- `@assessmentis/config-domain`: Configuration schemas
- Used by: `apps/functions` and `apps/frontend`
