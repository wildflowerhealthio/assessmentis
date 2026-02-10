# @assessmentis/daily-co-infrastructure

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

Effect-TS layer implementation providing Daily.co video call service integration for Assessment.is. This package contains only the server-side service layer for creating/managing Daily.co rooms.

**Note:** React UI components for Daily.co have been moved to `@assessmentis/daily-co-components`.

## What This Package Does

- Provides `DailyCoVideoCallClientLayer` Effect-TS layer
- Integrates with Daily.co API via proxy service
- Implements `VideoCallClient` interface from video-call-domain
- Manages video room creation and configuration
- Fetches recording metadata and access links
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

- Implement interfaces from video-call-domain
- Use Effect Layers for dependency injection
- Handle Daily.co API specifics
- Manage video room lifecycle

### ❌ DON'T:

- Add domain logic (use video-call-domain)
- Add UI components (use @assessmentis/daily-co-components)
- Expose API keys in code

## Related Packages

- `@assessmentis/video-call-domain`: Defines video call interfaces
- `@assessmentis/config-domain`: Configuration schemas
- `@assessmentis/daily-co-components`: React UI components for Daily.co
- `apps/functions`: Uses this for server-side video room creation
