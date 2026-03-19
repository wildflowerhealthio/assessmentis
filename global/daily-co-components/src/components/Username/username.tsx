import './Username.css'

import { useParticipantProperty } from '@daily-co/daily-react'

/**
 * Displays a participant's username with a "(you)" suffix for the local
 * user. Falls back to the session ID if no username is set. Username is
 * read from `@daily-co/daily-react` via `useParticipantProperty`.
 */
export default function Username({
  id,
  isLocal,
}: {
  id: string
  isLocal?: boolean | undefined
}): React.JSX.Element {
  const username = useParticipantProperty(id, 'user_name')

  return (
    <div className="username">
      {username || id} {isLocal && '(you)'}
    </div>
  )
}
