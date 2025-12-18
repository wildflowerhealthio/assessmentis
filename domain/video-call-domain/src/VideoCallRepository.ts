import { Effect, Context } from 'effect'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import { VideoCallRoom } from './models/VideoCallRoom'

export class VideoCallRepository extends Context.Tag('VideoCallRepository')<
  VideoCallRepository,
  {
    readVideoCallRoomsByEncounterId: (
      encounterId: EncounterId
    ) => Effect.Effect<VideoCallRoom[], UnhandledError, never>

    createVideoCallRooms: (
      rooms: Omit<VideoCallRoom, 'videoCallRoomId'>[]
    ) => Effect.Effect<VideoCallRoom[], UnhandledError, never>
  }
>() {}
