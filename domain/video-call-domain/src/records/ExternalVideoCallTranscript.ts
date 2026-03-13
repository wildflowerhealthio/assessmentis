import { Schema } from 'effect'

import type { VideoCallRoomId } from './VideoCallRoom'

export const ExternalVideoCallTranscriptionId = Schema.String.pipe(
  Schema.brand('ExternalVideoCallTranscriptionId')
)

export type ExternalVideoCallTranscriptionId =
  typeof ExternalVideoCallTranscriptionId.Type

export interface ExternalVideoCallTranscript {
  externalTranscriptionId: ExternalVideoCallTranscriptionId
  externalRoomId: VideoCallRoomId
}
