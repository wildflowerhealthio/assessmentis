# @assessmentis/firebase-web-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Infrastructure package providing Firebase integration for Assessment.is web applications.

## What This Package Does

- Integrates with Firebase services (Auth, Hosting, etc.)
- Provides Firebase client initialization
- Handles authentication flows
- Manages Firebase configuration

## Important Guidelines

### ✅ DO:

- Initialize Firebase properly before use
- Handle authentication state changes
- Use environment variables for configuration
- Provide proper error handling

### ❌ DON'T:

- Add domain logic (use clinical-domain)
- Hardcode Firebase configuration
- Expose sensitive credentials

## Related Packages

- Used by: `apps/frontend` for authentication and hosting
- `@assessmentis/config-domain`: Configuration schemas
