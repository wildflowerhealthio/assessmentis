# @assessmentis/daily-co-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Infrastructure package providing Daily.co video conferencing integration for Assessment.is.

## What This Package Does

- Integrates with Daily.co API for video calls
- Implements video call interfaces from clinical-domain
- Provides video room management
- Handles Daily.co-specific logic
- Supports optional AWS S3 recordings bucket configuration

## Features

### AWS S3 Recordings Storage

Daily.co rooms can be configured to store recordings in a custom AWS S3 bucket. When creating a room with the `recordingsBucket` configuration:

- Recordings are automatically stored in the specified S3 bucket
- IAM role authentication is used for secure access
- API access to recordings can be controlled via the `allow_api_access` flag

Configuration requires:
- `bucket_name`: Name of the S3 bucket
- `bucket_region`: AWS region where the bucket exists
- `assume_role_arn`: ARN of the IAM role for Daily.co to assume
- `allow_api_access`: Whether Daily's API allows downloading recordings

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
