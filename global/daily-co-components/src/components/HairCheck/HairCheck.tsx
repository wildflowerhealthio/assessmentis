import {
  DailyVideo,
  useDaily,
  useDailyEvent,
  useDevices,
  useLocalSessionId,
  useParticipantProperty,
} from '@daily-co/daily-react'
import React, { useCallback, useEffect, useState } from 'react'
import UserMediaError from '../UserMediaError/UserMediaError'

import './HairCheck.css'

/**
 * Pre-call setup screen for camera, microphone, and speaker selection.
 * Shows a live video preview and lets the user set their display name
 * before joining. Falls back to {@link UserMediaError} on device failure.
 */
export default function HairCheck({
  joinCall,
  cancelCall,
}: {
  joinCall: (username: string) => void
  cancelCall: () => void
}) {
  const localSessionId = useLocalSessionId()
  const initialUsername = useParticipantProperty(localSessionId, 'user_name')
  const {
    currentCam,
    currentMic,
    currentSpeaker,
    microphones,
    speakers,
    cameras,
    setMicrophone,
    setCamera,
    setSpeaker,
  } = useDevices()
  const callObject = useDaily()
  const [username, setUsername] = useState(initialUsername)

  const [getUserMediaError, setGetUserMediaError] = useState(false)

  useEffect(() => {
    setUsername(initialUsername)
  }, [initialUsername])

  useDailyEvent(
    'camera-error',
    useCallback(() => {
      setGetUserMediaError(true)
    }, [])
  )

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setUsername(e.target.value)
    callObject?.setUserName(e.target.value)
  }

  const handleJoin = (e: React.SyntheticEvent) => {
    e.preventDefault()
    joinCall(username.trim())
  }

  const updateMicrophone: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setMicrophone(e.target.value)
  }

  const updateSpeakers: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setSpeaker(e.target.value)
  }

  const updateCamera: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setCamera(e.target.value)
  }

  return getUserMediaError ? (
    <UserMediaError />
  ) : (
    <form className="hair-check" onSubmit={handleJoin}>
      <h2 className="heading-4">Setup your hardware</h2>
      {/* Video preview */}
      {localSessionId && (
        <DailyVideo type="video" sessionId={localSessionId} mirror />
      )}

      {/* Username */}
      <div className="inputs">
        <label className="text-label-2" htmlFor="username">
          Your name:
          <input
            className="element-text-entry input-2"
            name="username"
            type="text"
            placeholder="Enter username"
            onChange={handleChange}
            value={username || ' '}
          />
        </label>

        <label className="text-label-2" htmlFor="micOptions">
          Microphone:
          <select
            className="element-text-entry input-2"
            name="micOptions"
            id="micSelect"
            onChange={updateMicrophone}
            value={currentMic?.device?.deviceId}
          >
            {microphones.map((mic) => (
              <option
                key={`mic-${mic.device.deviceId}`}
                value={mic.device.deviceId}
              >
                {mic.device.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-label-2" htmlFor="speakersOptions">
          Speakers:
          <select
            name="speakersOptions"
            className="element-text-entry input-2"
            id="speakersSelect"
            onChange={updateSpeakers}
            value={currentSpeaker?.device?.deviceId}
          >
            {speakers.map((speaker) => (
              <option
                key={`speaker-${speaker.device.deviceId}`}
                value={speaker.device.deviceId}
              >
                {speaker.device.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-label-2" htmlFor="cameraOptions">
          Camera:
          <select
            name="cameraOptions"
            className="element-text-entry input-2"
            id="cameraSelect"
            onChange={updateCamera}
            value={currentCam?.device?.deviceId}
          >
            {cameras.map((camera) => (
              <option
                key={`cam-${camera.device.deviceId}`}
                value={camera.device.deviceId}
              >
                {camera.device.label}
              </option>
            ))}
          </select>
        </label>

        <button
          style={{ width: '100%' }}
          className="element-button button-3 outline accent-blue"
          onClick={handleJoin}
          type="submit"
        >
          Join call
        </button>

        <button
          style={{ width: '100%' }}
          className="element-button button-3 outline"
          onClick={cancelCall}
          type="button"
        >
          Back to start
        </button>
      </div>
    </form>
  )
}
