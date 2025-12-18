import { Effect, Context } from 'effect'
import { EncounterId } from '../administration/resources/Encounter'
import { UnhandledError } from '../errors'
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
