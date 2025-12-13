import {
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
} from './VideoCallRoom'

export interface ExternalVideoCallRoom {
  id: ExternalVideoCallRoomId
  roomName: ExternalVideoCallRoomName
  url: string
}
