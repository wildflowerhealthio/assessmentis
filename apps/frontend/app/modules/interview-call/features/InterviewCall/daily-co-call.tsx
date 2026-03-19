'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { Call, HairCheck, Tray } from '@assessmentis/daily-co-components/components'

import type { DailyEvent } from '@daily-co/daily-js'
import { DailyAudio, DailyProvider, useCallObject } from '@daily-co/daily-react'

enum VideoCallState {
  STATE_IDLE = 'STATE_IDLE',
  STATE_CREATING = 'STATE_CREATING',
  STATE_JOINING = 'STATE_JOINING',
  STATE_JOINED = 'STATE_JOINED',
  STATE_LEAVING = 'STATE_LEAVING',
  STATE_ERROR = 'STATE_ERROR',
  STATE_HAIRCHECK = 'STATE_HAIRCHECK',
}

const useDailyCall = (
  roomUrl: string | undefined
): {
  callObject: ReturnType<typeof useCallObject>
  createCall: () => void
  joinCall: (userName: string) => void
  recording: { action: () => void; state: 'loading' | 'started' | 'stopped' }
  startLeavingCall: () => void
  uiState:
    | { state: 'api_error' }
    | { state: 'haircheck' }
    | { state: 'in_call' }
    | { state: 'loading' }
} => {
  const navigate = useNavigate()
  const [recordingState, setRecordingState] = useState<'stopped' | 'loading' | 'started'>('loading')
  const [appState, setAppState] = useState(VideoCallState.STATE_IDLE)
  const [meetingToken, _setMeetingToken] = useState<string | undefined>()
  const callObject = useCallObject({})

  const [apiError] = useState(false)

  const createCall = useCallback(() => {
    setAppState(VideoCallState.STATE_CREATING)

    try {
      // TODO: Replace with hub / token client
      // oxfmt-ignore
      // const client = await Effect.runPromise(VideoCallClientService.client)
      // if (roomUrl) {
      //   const roomName = client.extractRoomNameFromUrl(roomUrl)
      //   if (roomName) {
      //     const token = await Effect.runPromise(
      //       Client.createRoomToken({ roomName, is_owner: true })
      //     )
      //     setMeetingToken(token)
      //     setAppState(VideoCallState.STATE_HAIRCHECK)
      //     callObject?.preAuth({ url: roomUrl, token })
      //     callObject?.startCamera()
      //     return
      //   }
      // }

      // Fallback: no room name extractable, proceed without token
      setAppState(VideoCallState.STATE_HAIRCHECK)
      void callObject?.preAuth({ url: roomUrl })
      void callObject?.startCamera()
    } catch (error) {
      console.error('Failed to create room token:', error)
      // Fallback: proceed without token
      setAppState(VideoCallState.STATE_HAIRCHECK)
      void callObject?.preAuth({ url: roomUrl })
      void callObject?.startCamera()
    }
  }, [roomUrl, callObject])

  const startLeavingCall = (): void => {
    if (!callObject) {
      return
    }
    if (appState === VideoCallState.STATE_ERROR) {
      void callObject.destroy().then(() => {
        setAppState(VideoCallState.STATE_HAIRCHECK)
      })
    } else {
      setAppState(VideoCallState.STATE_LEAVING)
      void callObject.leave().then(() => navigate(-1))
    }
  }

  useEffect(() => {
    if (!callObject) {
      return
    }

    function handleNewMeetingState(): void {
      switch (callObject?.meetingState()) {
        case 'joined-meeting': {
          setAppState(VideoCallState.STATE_JOINED)
          break
        }
        case 'left-meeting': {
          void callObject.destroy().then(() => {
            setAppState(VideoCallState.STATE_HAIRCHECK)
          })
          break
        }
        case 'error': {
          setAppState(VideoCallState.STATE_ERROR)
          break
        }
        default: {
          break
        }
      }
    }

    handleNewMeetingState()

    const eventsOfInterest: DailyEvent[] = [
      'joined-meeting',
      'left-meeting',
      'error',
      'camera-error',
    ]

    eventsOfInterest.forEach((event) => callObject.on(event, handleNewMeetingState))

    return (): void => {
      eventsOfInterest.forEach((event) => callObject.off(event, handleNewMeetingState))
    }
  }, [callObject])

  const uiState = useMemo(() => {
    if (apiError) {
      return { state: 'api_error' } as const
    }

    switch (appState) {
      case VideoCallState.STATE_HAIRCHECK: {
        return { state: 'haircheck' } as const
      }
      case VideoCallState.STATE_JOINING:
      case VideoCallState.STATE_JOINED:
      case VideoCallState.STATE_ERROR: {
        return { state: 'in_call' } as const
      }
      case VideoCallState.STATE_IDLE:
      case VideoCallState.STATE_CREATING:
      case VideoCallState.STATE_LEAVING: {
        return { state: 'loading' } as const
      }
    }
  }, [apiError, appState])

  const joinCall = useCallback(
    (userName: string) => {
      setRecordingState('stopped')
      void callObject?.join({
        token: meetingToken,
        url: roomUrl ?? undefined,
        userName,
      })
    },
    [callObject, roomUrl, meetingToken]
  )

  const recording = useMemo(
    () =>
      ({
        loading: {
          action: (): void => {},
          state: 'loading' as const,
        },
        started: {
          action: (): void => {
            callObject?.stopRecording()
            callObject?.stopTranscription()
            setRecordingState('stopped')
          },
          state: 'started' as const,
        },
        stopped: {
          action: (): void => {
            callObject?.startTranscription({})
            callObject?.startRecording({
              width: 1280,
              height: 720,
              minIdleTimeOut: 60,
              type: 'cloud',
              layout: { preset: 'active-participant' },
            })
            setRecordingState('started')
          },
          state: 'stopped' as const,
        },
      })[recordingState],
    [callObject, recordingState]
  )

  return {
    callObject,
    createCall,
    joinCall,
    recording,
    startLeavingCall,
    uiState,
  }
}

interface DailyCoCallProps {
  roomUrl: string | undefined
  className?: string
}

export default function DailyCoCall({ roomUrl, className }: DailyCoCallProps): React.JSX.Element {
  const { joinCall, startLeavingCall, uiState, callObject, createCall, recording } =
    useDailyCall(roomUrl)

  useEffect(() => {
    if (callObject) {
      createCall()
    }
  }, [createCall, callObject])

  if (uiState.state === 'api_error') {
    return (
      <div className="api-error">
        <h1>Error</h1>
        <p>Something went wrong creating a video call room. You can try recreating it</p>
        <button className="element-button button-4">Recreate Video Call</button>
      </div>
    )
  }

  if (uiState.state === 'haircheck' || uiState.state === 'in_call') {
    return (
      <div className={className}>
        <DailyProvider url={roomUrl} callObject={callObject}>
          {uiState.state === 'haircheck' ? (
            <HairCheck joinCall={joinCall} cancelCall={startLeavingCall} />
          ) : (
            <>
              <Call />
              <Tray leaveCall={startLeavingCall} recording={recording} />
              <DailyAudio />
            </>
          )}
        </DailyProvider>
      </div>
    )
  }

  return <button onClick={createCall}> Start {uiState.state} </button>
}
