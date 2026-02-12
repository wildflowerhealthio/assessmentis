import type { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'

import { auth } from './FirebaseWebLayer'
import { FirebaseWeb } from '../../../infrastructure/firebase-web-infrastructure/src/tagClasses'
import { Effect } from 'effect'

export const googleAuthProvider = new GoogleAuthProvider()

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // 'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-healthcare',
] as const

for (const scope of scopes) {
  googleAuthProvider.addScope(scope)
}

export const redirectToSignIn = () =>
  signInWithRedirect(getAuth(), googleAuthProvider)

export const handleRedirectResult = () =>
  getRedirectResult(getAuth())
    .then((result) => {
      if (result == null) throw new Error('Invalid Redirect Result')
      console.log({ result })
      return result
    })
    // .then(signInResultHandler)
    .catch(handleAuthError)

export const signIn = () =>
  signInWithPopup(auth, googleAuthProvider)
    // .then(signInResultHandler)
    .catch(handleAuthError)

const handleAuthError = (error: FirebaseError) => {
  // Handle Errors here.
  const errorCode = error.code
  const errorMessage = error.message
  // The email of the user's account used.
  const email = error.customData?.email
  // The AuthCredential type that was used.
  const credential = GoogleAuthProvider.credentialFromError(error)
  console.error({ errorCode, errorMessage, email, credential })
}

export const getOauth2FromDb = () => {
  return localStorage.getItem('oauth2Token') ?? undefined
}

export const authTokenWatcher = Effect.gen(function* () {
  const { auth } = yield* FirebaseWeb
  return auth.onIdTokenChanged(async (user) => {
    if (user) {
      user
        .getIdToken()
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

      return
    }
  })
})
