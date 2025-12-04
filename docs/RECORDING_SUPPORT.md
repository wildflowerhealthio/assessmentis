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

- **Recording URLs**: `http://assessment.is/fhir/encounter-recording` (supports multiple values)
- **Transcript URL**: `http://assessment.is/fhir/encounter-transcript`

The video call room name is stored in `encounter.location[0].location.identifier.value` with system `http://assessment.is/fhir/video-call-room-name`.

### 4. Accessing Recording Data

To access recording and transcript data from an encounter:

```typescript
import { 
  getRecordings,
  getRecording,
  getTranscript 
} from '@assessmentis/domain/encounters'

// Get room name from location
const roomName = encounter.location?.[0]?.location?.identifier?.value

// Get recordings (returns array)
const recordingUrls = getRecordings(encounter)

// Get first recording
const firstRecordingUrl = getRecording(encounter)

// Get transcript URL
const transcriptUrl = getTranscript(encounter)
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

- `ExternalVideoCallRecording`: Represents a recording from Daily.co (includes `uri` and `recordingUrl` fields)

### Repository Methods

- `EncounterRepository.updateEncounter`: Updates an existing encounter
- `ExternalVideoCallClient.fetchRecordingsByRoomName`: Fetches recordings for a room (includes recording links from Daily.co API)

### Extension Helpers

- `withRecordings`: Adds multiple recording URLs to an encounter
- `withRecording`: Adds a single recording URL to an encounter
- `withTranscript`: Adds transcript URL to an encounter
- `getRecordings`: Retrieves all recording URLs from an encounter
- `getRecording`: Retrieves first recording URL from an encounter
- `getTranscript`: Retrieves transcript URL from an encounter
