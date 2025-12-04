# Daily.co Recording and Transcription Support

## Overview

The application now supports automatic recording and transcription of Daily.co video encounters using Daily.co's cloud recording and transcription APIs.

## How It Works

### 1. Recording Creation

When an encounter is created, the Daily.co room is automatically configured with recording enabled:

```typescript
const externalVideoCallRoom = yield* videoCalls.createRoom({
  enableRecording: true,
})
```

The recording starts automatically when participants join the call and stops when the call ends.

### 2. Recording Storage

After the call, recordings can be fetched and stored in the encounter:

```typescript
import { updateEncounterRecordingsAndTranscripts } from 'app/modules/encounters/actions/updateEncounterRecordingsAndTranscripts'

// Fetch and store recordings for an encounter
const updatedEncounter = yield* updateEncounterRecordingsAndTranscripts(encounterId)
```

### 3. Data Storage

Recordings and transcripts are stored as FHIR extensions on the Encounter resource:

- **Room Name**: `http://assessment.is/fhir/encounter-video-call-room-name`
- **Recording Reference**: `http://assessment.is/fhir/encounter-recording-reference`
- **Transcript Reference**: `http://assessment.is/fhir/encounter-transcript-reference`

### 4. Accessing Recording Data

To access recording and transcript data from an encounter:

```typescript
import { 
  getVideoCallRoomName,
  getRecordingReference,
  getTranscriptReference 
} from '@assessmentis/domain/encounters'

const roomName = getVideoCallRoomName(encounter)
const recordingId = getRecordingReference(encounter)
const transcriptText = getTranscriptReference(encounter)
```

## Important Notes

### Recording Availability

- Recordings are not immediately available after a call ends
- Daily.co processes recordings in the background (typically takes a few minutes)
- The `updateEncounterRecordingsAndTranscripts` action will return the encounter unchanged if no recordings are found yet

### Transcript Availability

- Transcripts are generated from recordings and may take longer to become available
- If a transcript is not yet available, `fetchTranscriptByRecordingId` returns `null`
- The encounter is updated with recording information even if transcripts are not yet available

### Daily.co API Proxy

All Daily.co API calls are proxied through the Firebase function at `/api/dailyco/*`:

- Recording list: `GET /api/dailyco/recordings?room_name={roomName}`
- Transcript: `GET /api/dailyco/recordings/{recordingId}/transcript`

## Future Enhancements

Potential areas for improvement:

1. **Automatic Polling**: Add background job to automatically check for recordings after encounters end
2. **Recording Playback**: Implement UI for viewing recordings within the application
3. **Transcript Display**: Show transcripts in the encounter details view
4. **Notification System**: Notify users when recordings/transcripts become available
5. **Storage Management**: Add tools for managing recording lifecycle and storage costs

## Technical Details

### Models

- `ExternalVideoCallRecording`: Represents a recording from Daily.co
- `ExternalVideoCallTranscript`: Represents a transcript associated with a recording

### Repository Methods

- `EncounterRepository.updateEncounter`: Updates an existing encounter
- `ExternalVideoCallClient.fetchRecordingsByRoomName`: Fetches recordings for a room
- `ExternalVideoCallClient.fetchTranscriptByRecordingId`: Fetches transcript for a recording

### Extension Helpers

- `withVideoCallRoomName`: Adds room name to an encounter
- `withRecordingReference`: Adds recording reference to an encounter
- `withTranscriptReference`: Adds transcript reference to an encounter
- `getVideoCallRoomName`: Retrieves room name from an encounter
- `getRecordingReference`: Retrieves recording reference from an encounter
- `getTranscriptReference`: Retrieves transcript reference from an encounter
