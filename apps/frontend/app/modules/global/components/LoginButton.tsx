import { useEffect, useState } from 'react'

import { auth } from 'app/FirebaseWebLayer'
import { signOut } from 'firebase/auth'

import { signIn } from '../../../firebase'

export const LoginButton = (props: {
  className: string
  style?: React.CSSProperties
  onLogin?: () => void
}) => {
  const [[label, action, disabled], setLabelAndAction] = useState<
    [string, undefined | (() => void), boolean]
  >(['Logout', undefined, true])

  useEffect(() => {
    return auth.onIdTokenChanged((maybeUser) => {
      if (maybeUser) {
        setLabelAndAction([
          'Logout',
          () => {
            signOut(auth)
          },
          false,
        ])
      } else {
        setLabelAndAction([
          'Login',
          async () => {
            await signIn()
            props.onLogin?.()
          },
          false,
        ])
      }
    })
  }, [props])

  return (
    <button
      className={props.className}
      onClick={action}
      disabled={disabled}
      style={props.style}
    >
      {label}
    </button>
  )
}
