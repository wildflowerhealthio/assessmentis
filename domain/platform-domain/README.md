# @assessmentis/platform-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package models the Assessment.is platform itself, providing abstractions and services for platform-level concerns that coordinate between different domain areas.

## What This Package Does

- Model platform-wide services and abstractions
- Coordinate between different domain areas
- Handle platform-level configurations and settings

## Project Structure

```
src/
├── index.ts              # Main exports
├── PlatformService.ts    # Core platform service definition
└── loadedValues/         # Configuration and loaded data
```

## Important Guidelines

### ✅ DO:

- Keep platform logic in terms of the config-domain and platform-domain
- Define clear service interfaces with Effect Tags
- Use dependency injection via Effect Layers

### ❌ DON'T:

- Add infrastructure-specific implementations (use infrastructure packages)
- Hardcode configuration values
- Duplicate logic from other domain packages

## Related Packages

- `@assessmentis/clinical-domain`: Clinical domain logic
- `@assessmentis/config-domain`: Configuration models
- Infrastructure packages: Provide implementations
