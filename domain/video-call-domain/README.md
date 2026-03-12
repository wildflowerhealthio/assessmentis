# @assessmentis/video-call-domain

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package provides domain models and repository interfaces for video call functionality in Assessment.is. It defines the core abstractions for managing video call rooms, recordings, and transcripts, independent of any specific video call provider.

## What This Package Does

- Define video call domain models (rooms, recordings, transcripts)
- Provide repository interfaces for video call data access
- Define external video call client abstractions
- Model video call sessions and their metadata

## Project Structure

```plaintext
src/
├── index.ts                              # Main exports
├── VideoCallClient.ts            # Abstract client for external video providers
├── VideoCallRepository.ts                # Repository for video call room data
└── models/
    ├── VideoCallRoom.ts                  # Internal video call room model
    ├── VideoCallRecording.ts             # Internal recording model
    ├── ExternalVideoCallRoom.ts          # External provider room model
    ├── ExternalVideoCallRecording.ts     # External provider recording model
    ├── ExternalVideoCallTranscript.ts    # External provider transcript model
    └── ExternalVideoCallRecordingRepository.ts  # Repository for external recordings
```

## Usage

### Video Call Repository

```typescript
import { VideoCallRepository } from '@assessmentis/video-call-domain'
import { Effect } from 'effect'

Effect.gen(function* () {
  const repo = yield* VideoCallRepository
  const rooms = yield* repo.readVideoCallRoomsByEncounterId(encounterId)
  return rooms
})
```

### External Video Call Client

```typescript
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { Effect } from 'effect'

Effect.gen(function* () {
  const client = yield* VideoCallClient
  const room = yield* client.createRoom({
    enableRecording: true,
    enableChat: false,
  })
  return room
})
```

## Important Guidelines

### ✅ DO:

- Keep video call logic provider-agnostic
- Use Effect Schema for all model definitions
- Define repository interfaces as Effect Tags
- Use branded types for IDs
- Write comprehensive tests for schemas
- Use Effect's `DateTime.Utc` for timestamps

### ❌ DON'T:

- Add provider-specific implementations (use infrastructure packages)
- Add specific HTTP/API calls
- Bypass Effect Schema validation
- Couple to specific video call providers

## Related Packages

- `@assessmentis/clinical-domain`: Clinical domain models (Encounter, Media)
- `@assessmentis/ontology`: Domain errors
- `@assessmentis/daily-co-infrastructure`: Daily.co implementation
- `@assessmentis/platform-domain`: Platform services that use video calls
