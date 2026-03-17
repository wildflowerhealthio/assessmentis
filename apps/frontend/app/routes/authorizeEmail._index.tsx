import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { auth } from 'app/FirebaseWebLayer'
import { onAuthStateChanged } from 'firebase/auth'

import type { Route } from './+types/authorizeEmail._index'

interface User {
  uid: string
  email: string
}
const AuthorizeEmail = (_: Route.ComponentProps) => {
  const [currentUser, setCurrentUser] = useState<User>({ uid: '', email: '' })
  const navigate = useNavigate()
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      console.log('setting current user')
      const currentUserObj = { uid: '', email: '' }
      if (user?.uid) {
        currentUserObj.uid = user.uid
        if (user.email) {
          currentUserObj.email = user.email
        } else {
          currentUserObj.email = 'Guest'
        }
      } else {
        // Login
        navigate('/login')
      }
      console.log(currentUserObj)
      setCurrentUser(currentUserObj)
    })
  }, [navigate])
  const googleoauth = () => {
    if (auth.currentUser) {
      auth.currentUser
        .getIdToken(true)
        .then(function (idToken) {
          fetch('/api/googleLogin', {
            method: 'POST',
            headers: {
              'Content-type': 'application/json',
              authorization: 'Bearer ' + idToken,
            },
            body: JSON.stringify({}),
          })
            .then((response) => response.json())
            .then((result) => {
              window.open(result.url, '_self')
            })
            .catch(function (error) {
              console.log('failed to fetch ' + error)
            })
        })
        .catch(function (error) {
          console.log('couldnt get user token ' + error)
        })
    }
  }

  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const success = searchParams.get('success')
  if (currentUser.email && email) {
    return (
      <div className="h-full flex flex-column justify-center">
        <div className="rounded p-6 mt-10">
          <p className="text-3xl mb-4">
            Authorization {success == 'true' ? 'complete' : 'incomplete'}
          </p>
          {success == 'true' && (
            <p className="text-lg">
              Your Print Submit account
              <b> {currentUser.email} </b>
              will now send automated emails from
              <b> {email}</b>
            </p>
          )}

          {success == 'false' && (
            <>
              <p className="text-lg">
                Email permisson not granted. Please try again
              </p>
              <button className="authorizeButton" onClick={() => googleoauth()}>
                <img
                  style={{
                    width: '20px',
                    marginRight: '5px',
                    marginBottom: '1px',
                  }}
                  src={'/g-logo.png'}
                  alt="Google logo"
                />
                Authorize Google account
              </button>
            </>
          )}
          <button
            className="border-[1px] border-black px-2 rounded mt-4 text-lg"
            onClick={() => {
              navigate('/')
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  } else {
    return (
      <>
        No Current User Email
        <button className="authorizeButton" onClick={() => googleoauth()}>
          <img
            style={{
              width: '20px',
              marginRight: '5px',
              marginBottom: '1px',
            }}
            src={'/g-logo.png'}
            alt="Google logo"
          />
          Authorize Google account
        </button>
      </>
    )
  }
}
export default AuthorizeEmail
