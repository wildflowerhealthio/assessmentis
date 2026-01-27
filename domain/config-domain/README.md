# @assessmentis/config-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package provides configuration models and schemas for infrastructure components in Assessment.is.

## What This Package Does

- Define configuration schemas for infrastructure services
- Provide type-safe configuration models with Effect Schema
- Enable runtime validation of configurations

## Project Structure

```
src/
├── index.ts              # Main exports
├── googleFhir/           # Google FHIR infrastructure config
└── dailyCo/              # Daily.co video service config
```

## Usage

```typescript
import { GoogleFhirConfig } from '@assessmentis/config-domain/googleFhir'
import { DailyCoProxyConfig } from '@assessmentis/config-domain/dailyCo'

// Validate environment variables
const config = Schema.decodeUnknownSync(GoogleFhirConfig)(envVars)

// Daily.co configuration with optional S3 recordings bucket
const dailyConfig: DailyCoConfig = {
  _tag: 'daily_co',
  dailyCoProxyUrl: 'https://api.daily.co/proxy',
  recordingsBucket: {
    bucket_name: 'my-recordings-bucket',
    bucket_region: 'us-east-1',
    assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRecordingRole',
    allow_api_access: true,
  },
}
```

## Important Guidelines

### ✅ DO:

- Use Effect Schema for all configuration models
- Validate configurations at application startup
- Use branded types for IDs and sensitive values

### ❌ DON'T:

- Include actual configuration values (only schemas/types)
- Add business logic or operations
- Hardcode secrets or API keys

## Configuration Pattern

```typescript
export const ServiceConfig = Schema.Struct({
  apiKey: Schema.String.pipe(Schema.nonEmpty(), Schema.brand('ApiKey')),
  endpoint: Schema.String.pipe(Schema.pattern(/^https:\/\//)),
  timeout: Schema.Number.pipe(Schema.positive(), Schema.int()),
})
```

## Related Packages

- `@assessmentis/google-fhir-web-infrastructure`: Uses googleFhir config
- `@assessmentis/daily-co-infrastructure`: Uses dailyCo config
