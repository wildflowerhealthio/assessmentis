import { useCallback, useState } from 'react'
import type { JSX } from 'react'

import {
  useDailyEvent,
  useLocalSessionId,
  useParticipantIds,
  useScreenShare,
} from '@daily-co/daily-react'

import Tile from '../Tile/tile'
import UserMediaError from '../UserMediaError/user-media-error'
import styles from './Call.module.css'

/**
 * Main video call view. Global call state is provided by
 * `@daily-co/daily-react`.
 *
 * Displays remote participants (or a screen share) as the primary tile,
 * with the local participant in a mini row.
 *
 * @remarks
 * Listens for `camera-error` via `useDailyEvent` — sets an error flag
 * that replaces the call UI with {@link UserMediaError}.
 */
export default function Call(): React.JSX.Element {
  /* If a participant runs into a getUserMedia() error, we need to warn them. */
  const [getUserMediaError, setGetUserMediaError] = useState(false)

  /* We can use the useDailyEvent() hook to listen for daily-js events. Here's a full list
   * of all events: https://docs.daily.co/reference/daily-js/events */
  useDailyEvent(
    'camera-error',
    useCallback(() => {
      setGetUserMediaError(true)
    }, [])
  )

  /* This is for displaying remote participants: this includes other humans, but also screen shares. */
  const { screens } = useScreenShare()
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' })

  /* This is for displaying our self-view. */
  const localSessionId = useLocalSessionId()

  if (getUserMediaError) {
    return <UserMediaError />
  }

  let focus: JSX.Element
  if (screens.length > 0) {
    focus = <Tile id={screens[0].session_id} isScreenShare />
  } else if (remoteParticipantIds.length > 0) {
    focus = (
      <Tile
        id={remoteParticipantIds[0]}
        style={{
          aspectRatio: 'calc(16/9)',
          margin: 'auto',
          maxWidth: '100%',
        }}
      />
    )
  } else {
    focus = (
      <div
        className={styles.Call__info}
        style={{
          aspectRatio: 'calc(16/9)',
          margin: 'auto',
          maxWidth: '100%',
        }}
      >
        <h2 className="heading-3">Waiting for others</h2>
        <p>Invite someone by sharing this link:</p>
        <span className="room-url">{window.location.href}</span>
      </div>
    )
  }
  return (
    <div className={styles.Call}>
      {focus}
      <div className={styles.Call__miniVideoRow}>
        {localSessionId && (
          <Tile
            id={localSessionId}
            isLocal
            style={{
              aspectRatio: 'calc(16/9)',
              height: '100%',
              margin: 'auto',
              maxWidth: '100%',
            }}
          />
        )}
      </div>
    </div>
  )
}
