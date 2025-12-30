# Daily.co Recordings Sync Cloud Functions

## Overview

This document describes the cloud functions responsible for syncing Daily.co recordings with FHIR Media resources.

## Functions

### `syncDailyCoRecordings` (Scheduled)

**Type:** Scheduled Cloud Function  
**Schedule:** Every 1 hour  
**Timezone:** America/Toronto

#### Purpose

Automatically syncs recordings from all organizations' Daily.co instances to their respective FHIR stores as Media resources.

#### How It Works

1. **Fetch Organizations**: Queries Firestore for all organizations
2. **For Each Organization**:
   - Checks if the organization uses Daily.co (based on `frontendConfig.videoCallClient._tag`)
   - Retrieves Daily.co API key from `orgs/{orgId}/secrets/dailyCo`
   - Retrieves FHIR store configuration from `frontendConfig.mediaRepository` and `frontendConfig.encounterRepository`
3. **Fetch Recordings**: Queries Daily.co API for all recordings
4. **Fetch Encounters**: Retrieves all Encounter resources from the FHIR store
5. **Match and Sync**:
   - For each Encounter, extracts the room URL from `location[0].location.identifier.value`
   - Matches recordings to encounters by room name
   - Fetches existing Media resources for each encounter
   - Creates new Media resources for recordings not yet in the FHIR store
   - Updates existing Media resources with fresh download URLs
6. **Error Handling**:
   - Tracks failures in Firestore at `orgs/{orgId}/syncFailures/dailyCoRecordings`
   - Logs warnings when an org has 3+ consecutive failures
   - Clears failure counts on successful sync

#### Configuration Required

Each organization must have:
- `frontendConfig.videoCallClient` with `_tag: "daily_co_proxy"`
- `orgs/{orgId}/secrets/dailyCo` with `apiKey` field
- `frontendConfig.mediaRepository` and `frontendConfig.encounterRepository` with `_tag: "google_fhir_store"`

### `syncDailyCoRecordingsManual` (Callable)

**Type:** Callable Cloud Function (HTTPS)

#### Purpose

Allows administrators to manually trigger a recordings sync on-demand.

#### How It Works

Same as the scheduled function, but returns a detailed response with:
- Total number of organizations processed
- Number of successful vs failed organizations
- Detailed results for each organization (recordings found, media created/updated)

#### Response Format

```json
{
  "success": true,
  "totalOrgs": 5,
  "successfulOrgs": 4,
  "failedOrgs": 1,
  "results": {
    "successful": [
      {
        "orgId": "org1",
        "recordingsFound": 10,
        "mediaCreated": 5,
        "mediaUpdated": 5
      }
    ],
    "failed": [
      {
        "orgId": "org2",
        "errors": ["No Daily.co API key"]
      }
    ]
  }
}
```

#### Calling the Function

```javascript
const functions = getFunctions()
const sync = httpsCallable(functions, 'syncDailyCoRecordingsManual')
const result = await sync()
console.log(result.data)
```

## FHIR Media Resource Structure

The functions create/update Media resources with the following structure:

```json
{
  "resourceType": "Media",
  "status": "completed",
  "identifier": [
    {
      "value": "recording-id-from-dailyco"
    }
  ],
  "createdDateTime": "2024-01-15T10:30:00Z",
  "duration": 3600,
  "content": {
    "url": "https://daily.co/recording/download/link"
  },
  "encounter": {
    "reference": "Encounter/encounter-id"
  }
}
```

## Error Handling and Monitoring

### Failure Tracking

When a sync fails for an organization, the function:
1. Writes to `orgs/{orgId}/syncFailures/dailyCoRecordings` with:
   - `lastFailure`: ISO timestamp
   - `lastErrors`: Array of error messages
   - `consecutiveFailures`: Count of consecutive failures
2. Logs a warning when failures reach 3+

### Success Handling

On successful sync:
- Deletes the failure tracking document
- Logs success metrics (recordings found, media created/updated)

### Admin Notifications

**TODO**: Implement automated notifications when failures reach a threshold

Recommended approaches:
1. **Email**: Use SendGrid or Firebase Extensions
2. **Slack**: Configure webhook integration
3. **Dashboard**: Create admin dashboard showing sync status

## Deployment

The functions are deployed as part of the `@assessmentis/functions` package:

```bash
cd apps/functions
npm run build
firebase deploy --only functions
```

## Testing

To test manually:

1. **Deploy the functions** to a test environment
2. **Call the manual sync function** from the Firebase console or using the Firebase SDK
3. **Monitor logs** in Firebase Console > Functions > Logs
4. **Verify FHIR store** contains the expected Media resources

## Permissions Required

The Cloud Functions service account needs:
- `roles/healthcare.fhirResourceEditor` on the FHIR store
- Read access to Firestore collections: `orgs`, `orgs/{orgId}/secrets`
- Write access to Firestore collection: `orgs/{orgId}/syncFailures`

## Troubleshooting

### Common Issues

**"No Daily.co API key"**
- Ensure `orgs/{orgId}/secrets/dailyCo` document exists with `apiKey` field

**"No FHIR store configured"**
- Verify `frontendConfig.mediaRepository._tag === "google_fhir_store"`
- Verify `frontendConfig.encounterRepository._tag === "google_fhir_store"`

**"Failed to fetch recordings from Daily.co"**
- Check Daily.co API key is valid
- Verify network connectivity from Cloud Functions

**"Failed to fetch encounters from FHIR store"**
- Verify Cloud Functions service account has FHIR store permissions
- Check FHIR store configuration (projectId, region, dataset, storeId)

## Future Enhancements

- [ ] Pagination for large numbers of recordings/encounters
- [ ] Support for transcripts (in addition to recordings)
- [ ] Configurable sync schedule per organization
- [ ] Sync status dashboard in admin UI
- [ ] Automated admin notifications via email/Slack
- [ ] Retry logic with exponential backoff
- [ ] Metrics and monitoring integration (e.g., Cloud Monitoring)
