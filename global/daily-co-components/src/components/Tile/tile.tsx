import type { CSSProperties } from 'react'

import { DailyVideo } from '@daily-co/daily-react'

import Username from '../Username/username'

/**
 * Renders a single participant's video feed. Video is provided by
 * `@daily-co/daily-react` via `DailyVideo`. Displays a {@link Username}
 * overlay unless the tile is a screen share.
 */
export default function Tile({
  id,
  isScreenShare,
  isLocal,
  style,
}: {
  id: string
  isScreenShare?: boolean
  isLocal?: boolean | undefined
  style?: CSSProperties | undefined
}): React.JSX.Element {
  // Const videoState = useVideoTrack(id);

  return (
    <div style={style}>
      <DailyVideo
        automirror
        style={style}
        sessionId={id}
        type={isScreenShare ? 'screenVideo' : 'video'}
      />
      {!isScreenShare && <Username id={id} isLocal={isLocal} />}
    </div>
  )
}
