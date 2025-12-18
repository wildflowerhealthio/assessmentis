# @assessmentis/eslint-config

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Shared ESLint configuration for Assessment.is packages.

## What This Package Does

- Provides base ESLint rules for all packages
- Integrates TypeScript, React, and Prettier
- Ensures consistent code style across the monorepo

## Usage

In your package's `eslint.config.js`:

```javascript
import baseConfig from '@assessmentis/eslint-config'

export default [
  ...baseConfig,
  // Your package-specific overrides
]
```

## Configuration

This config includes:

- TypeScript ESLint rules
- React hooks rules (for React packages)
- React Refresh rules (for React packages)
- Prettier integration
- Standard JavaScript best practices

## Important Guidelines

### ❌ DON'T:

- Modify this config without team discussion
- Add project-specific rules here (use package-level overrides)
- Disable important safety rules

## Related Packages

- `@assessmentis/prettier-config`: Formatting rules
- Used by: All packages in the monorepo
