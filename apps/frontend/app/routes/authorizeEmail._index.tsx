import { Effect } from 'effect'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase-web-layer'

import type { Route } from './+types/authorizeEmail._index'

interface User {
  uid: string
  email: string
}
const AuthorizeEmail = (_: Route.ComponentProps): React.JSX.Element => {
  const [currentUser, setCurrentUser] = useState<User>({ email: '', uid: '' })
  const navigate = useNavigate()
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      const currentUserObj = { email: '', uid: '' }
      if (user?.uid) {
        currentUserObj.uid = user.uid
        if (user.email) {
          currentUserObj.email = user.email
        } else {
          currentUserObj.email = 'Guest'
        }
      } else {
        // Login
        void navigate('/login')
      }
      setCurrentUser(currentUserObj)
    })
  }, [navigate])
  const googleoauth = (): void => {
    void Effect.runPromise(
      Effect.gen(function* () {
        const { currentUser: authedUser } = auth
        if (authedUser) {
          const idToken = yield* Effect.tryPromise(() => authedUser.getIdToken(true)).pipe(
            Effect.tapError((error) => Effect.logError(`couldn't get user token`, error))
          )

          const result = yield* Effect.tryPromise(() =>
            fetch('/api/googleLogin', {
              body: JSON.stringify({}),
              headers: {
                'Content-type': 'application/json',
                authorization: `Bearer ${idToken}`,
              },
              method: 'POST',
            }).then((response) => response.json())
          ).pipe(
            Effect.tapError((error) => Effect.logError(`couldnt fetch google login url`, error))
          )

          window.open(result.url, '_self')
        }
      })
    )
  }

  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const success = searchParams.get('success')
  if (currentUser.email && email) {
    return (
      <div className="h-full flex flex-column justify-center">
        <div className="rounded p-6 mt-10">
          <p className="text-3xl mb-4">
            Authorization {success === 'true' ? 'complete' : 'incomplete'}
          </p>
          {success === 'true' && (
            <p className="text-lg">
              Your Print Submit account
              <b> {currentUser.email} </b>
              will now send automated emails from
              <b> {email}</b>
            </p>
          )}

          {success === 'false' && (
            <>
              <p className="text-lg">Email permisson not granted. Please try again</p>
              <button
                className="authorizeButton"
                onClick={() => {
                  googleoauth()
                }}
              >
                <img
                  style={{
                    marginBottom: '1px',
                    marginRight: '5px',
                    width: '20px',
                  }}
                  src="/g-logo.png"
                  alt="Google logo"
                />
                Authorize Google account
              </button>
            </>
          )}
          <button
            className="border-[1px] border-black px-2 rounded mt-4 text-lg"
            onClick={() => {
              void navigate('/')
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }
  return (
    <>
      No Current User Email
      <button
        className="authorizeButton"
        onClick={() => {
          googleoauth()
        }}
      >
        <img
          style={{
            marginBottom: '1px',
            marginRight: '5px',
            width: '20px',
          }}
          src="/g-logo.png"
          alt="Google logo"
        />
        Authorize Google account
      </button>
    </>
  )
}
export default AuthorizeEmail
