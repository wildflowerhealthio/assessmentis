# @assessmentis/daily-co-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Infrastructure package providing Daily.co video conferencing integration for Assessment.is.

## What This Package Does

- Integrates with Daily.co API for video calls
- Implements video call interfaces from clinical-domain
- Provides video room management
- Handles Daily.co-specific logic

## Important Guidelines

### ✅ DO:

- Implement interfaces from clinical-domain
- Use Effect Layers for dependency injection
- Handle Daily.co API specifics
- Manage video room lifecycle

### ❌ DON'T:

- Add domain logic (use clinical-domain)
- Add UI components (React components go in apps)
- Expose API keys in code

## Related Packages

- `@assessmentis/clinical-domain`: Defines video call interfaces
- `@assessmentis/config-domain`: Configuration schemas
- `apps/functions`: Uses this for server-side video room creation
