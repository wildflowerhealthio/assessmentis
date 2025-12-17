# @assessmentis/util

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package provides domain-agnostic utility functions used throughout Assessment.is.

## What This Package Does

- Provide general-purpose utility functions
- Define common patterns (LoadedResult, etc.)
- Keep utilities framework-agnostic and reusable

## Exports

```
. - Main utilities
./LoadedResult - LoadedResult type and utilities
```

## Important Guidelines

### ✅ DO:

- Keep utilities framework-agnostic
- Write comprehensive tests
- Document usage clearly
- Use Effect-TS where appropriate

### ❌ DON'T:

- Add business logic (use domain packages)
- Add application-specific code
- Add heavy dependencies

## Related Packages

- Used by: All domain and infrastructure packages
