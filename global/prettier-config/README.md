# @assessmentis/prettier-config

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Shared Prettier configuration for Assessment.is.

## What This Package Does

- Provides consistent code formatting rules
- Enforces no semicolons, single quotes, 2-space indentation

## Configuration

```javascript
{
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true
}
```

## Usage

In your package's `package.json`:

```json
{
  "prettier": "@assessmentis/prettier-config"
}
```

## Important Guidelines

### ❌ DON'T:

- Modify without team consensus
- Override in individual packages

## Related Packages

- `@assessmentis/eslint-config`: Integrates with Prettier
- Used by: All packages in the monorepo
