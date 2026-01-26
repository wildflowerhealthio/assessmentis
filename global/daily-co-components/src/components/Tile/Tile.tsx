import { DailyVideo } from '@daily-co/daily-react'
import Username from '../Username/Username'
import { CSSProperties } from 'react'

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
}) {
  // const videoState = useVideoTrack(id);

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
