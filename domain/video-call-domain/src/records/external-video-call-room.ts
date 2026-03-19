import type { VideoCallRoomId, VideoCallRoomName } from './video-call-room'

export interface ExternalVideoCallRoom {
  id: VideoCallRoomId
  roomName: VideoCallRoomName
  url: string
}
