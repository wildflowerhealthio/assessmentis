# @assessmentis/typescript-config

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Shared TypeScript configurations for Assessment.is packages.

## What This Package Does

- Provides base TypeScript compiler configurations
- Ensures consistent TypeScript settings across the monorepo
- Offers different configs for different package types

## Available Configurations

- `base.json` - Base configuration for all packages
- `react-library.json` - For React library packages
- `vite.json` - For Vite-based applications

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@assessmentis/typescript-config/base.json",
  "compilerOptions": {
    // Package-specific overrides
  }
}
```

## Important Guidelines

### ❌ DON'T:

- Disable strict mode
- Weaken type safety settings
- Modify without team discussion

## Related Packages

- Used by: All TypeScript packages in the monorepo
