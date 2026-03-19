import { useEffect, useState } from 'react'

import { signOut } from 'firebase/auth'
import { auth } from '@/firebase-web-layer'

import { signIn } from '../../../firebase'

export const LoginButton = (props: {
  className: string
  style?: React.CSSProperties
  onLogin?: () => void
}): React.JSX.Element => {
  const [[label, action, disabled], setLabelAndAction] = useState<
    [string, undefined | (() => void), boolean]
  >(['Logout', undefined, true])

  useEffect(
    () =>
      auth.onIdTokenChanged((maybeUser) => {
        if (maybeUser) {
          setLabelAndAction([
            'Logout',
            (): void => {
              void signOut(auth)
            },
            false,
          ])
        } else {
          setLabelAndAction([
            'Login',
            async (): Promise<void> => {
              await signIn()
              props.onLogin?.()
            },
            false,
          ])
        }
      }),
    [props.onLogin]
  )

  return (
    <button className={props.className} onClick={action} disabled={disabled} style={props.style}>
      {label}
    </button>
  )
}
