import { signOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { signIn } from '../../../firebase'
import { auth } from 'app/FirebaseWebLayer'

export const LoginButton = (props: {
  className: string
  style?: React.CSSProperties
  onLogin: () => void
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
            props.onLogin()
          },
          false,
        ])
      }
    })
  }, [])

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
