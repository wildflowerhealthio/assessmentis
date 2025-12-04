import { ExternalVideoCallRecordingId } from './VideoCallRecording'

export interface ExternalVideoCallTranscript {
  externalVideoCallRecordingId: ExternalVideoCallRecordingId
  transcriptText: string
  language?: string
}
