import type { VideoCallRoomId, VideoCallRoomName } from './VideoCallRoom'

export interface ExternalVideoCallRoom {
  id: VideoCallRoomId
  roomName: VideoCallRoomName
  url: string
}
