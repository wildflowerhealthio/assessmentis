import { useCallback, useState } from 'react'

import {
  useAppMessage,
  useAudioTrack,
  useDaily,
  useLocalSessionId,
  useScreenShare,
  useVideoTrack,
} from '@daily-co/daily-react'

import Chat from '../Chat/chat'
import MeetingInformation from '../MeetingInformation/meeting-information'

// eslint-disable-next-line import/no-unassigned-import
import './Tray.css'

import {
  CameraOff,
  CameraOn,
  ChatHighlighted,
  ChatIcon,
  Info,
  Leave,
  MicrophoneOff,
  MicrophoneOn,
  Screenshare,
} from './Icons'

/**
 * Bottom control bar for an active call. Global call state is provided by
 * `@daily-co/daily-react`.
 *
 * Provides toggles for camera, mic, screen share, meeting info, chat,
 * recording, and a leave button.
 *
 * @remarks
 * Listens for `app-message` events via `useAppMessage` — highlights the
 * chat icon when a remote participant sends a message while the chat panel
 * is closed.
 */
export default function Tray({
  leaveCall,
  recording,
}: {
  leaveCall: () => void
  recording: { state: 'stopped' | 'loading' | 'started'; action: () => void }
}): React.JSX.Element {
  const callObject = useDaily()
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare()

  const [showMeetingInformation, setShowMeetingInformation] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [newChatMessage, setNewChatMessage] = useState(false)

  const localSessionId = useLocalSessionId()
  const localVideo = useVideoTrack(localSessionId)
  const localAudio = useAudioTrack(localSessionId)
  const mutedVideo = localVideo.isOff
  const mutedAudio = localAudio.isOff

  /* When a remote participant sends a message in the chat, we want to display a differently colored
   * chat icon in the Tray as a notification. By listening for the `"app-message"` event we'll know
   * when someone has sent a message. */
  useAppMessage({
    onAppMessage: useCallback(() => {
      /* Only light up the chat icon if the chat isn't already open. */
      if (!showChat) {
        setNewChatMessage(true)
      }
    }, [showChat]),
  })

  const toggleVideo = useCallback(() => {
    callObject?.setLocalVideo(mutedVideo)
  }, [callObject, mutedVideo])

  const toggleAudio = useCallback(() => {
    callObject?.setLocalAudio(mutedAudio)
  }, [callObject, mutedAudio])

  const toggleScreenShare = (): void => {
    if (isSharingScreen) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }

  const toggleMeetingInformation = (): void => {
    setShowMeetingInformation(!showMeetingInformation)
  }

  const toggleChat = (): void => {
    setShowChat(!showChat)
    if (newChatMessage) {
      setNewChatMessage(!newChatMessage)
    }
  }

  return (
    <div className="tray">
      {showMeetingInformation && <MeetingInformation />}
      {/*  The chat messages 'live' in the <Chat/> component's state. We can't just remove the component */}
      {/*  From the DOM when hiding the chat, because that would cause us to lose that state. So we're */}
      {/*  Choosing a slightly different approach of toggling the chat: always render the component, but only */}
      {/*  Render its HTML when showChat is set to true. */}

      {/*   We're also passing down the toggleChat() function to the component, so we can open and close the chat */}
      {/*   From the chat UI and not just the Tray. */}
      <Chat showChat={showChat} toggleChat={toggleChat} />
      <div className="tray-buttons-container">
        <div className="controls">
          <button onClick={toggleVideo} type="button">
            {mutedVideo ? <CameraOff /> : <CameraOn />}
            {mutedVideo ? 'Turn camera on' : 'Turn camera off'}
          </button>
          <button onClick={toggleAudio} type="button">
            {mutedAudio ? <MicrophoneOff /> : <MicrophoneOn />}
            {mutedAudio ? 'Unmute mic' : 'Mute mic'}
          </button>
        </div>
        <div className="actions">
          <button onClick={toggleScreenShare} type="button">
            <Screenshare />
            {isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
          </button>
          <button onClick={toggleMeetingInformation} type="button">
            <Info />
            {showMeetingInformation ? 'Hide info' : 'Show info'}
          </button>
          <button onClick={toggleChat} type="button">
            {newChatMessage ? <ChatHighlighted /> : <ChatIcon />}
            {showChat ? 'Hide chat' : 'Show chat'}
          </button>
        </div>
        <div className="record">
          <button onClick={recording.action} type="button" disabled={recording.state === 'loading'}>
            {
              {
                loading: 'Loading...',
                started: 'Stop Recording',
                stopped: 'Start Recording',
              }[recording.state]
            }
          </button>
        </div>
        <div className="leave">
          <button onClick={leaveCall} type="button">
            <Leave /> Leave call
          </button>
        </div>
      </div>
    </div>
  )
}
