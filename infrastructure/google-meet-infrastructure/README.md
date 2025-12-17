# @assessmentis/google-meet-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Infrastructure package for Google Meet integration in Assessment.is.

## What This Package Does

- Provides Google Meet API integration
- Implements video call interfaces from clinical-domain
- Handles Google Meet-specific logic

## Important Guidelines

### ✅ DO:

- Implement interfaces from clinical-domain
- Use Effect Layers for dependency injection
- Handle Google Meet API specifics

### ❌ DON'T:

- Add domain logic (use clinical-domain)
- Add UI components (use React components in apps)

## Related Packages

- `@assessmentis/clinical-domain`: Defines video call interfaces
- `@assessmentis/config-domain`: Configuration schemas
