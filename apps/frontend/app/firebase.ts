import { Effect } from 'effect'

import type { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'

import { FirebaseWeb } from '../../../infrastructure/firebase-web-infrastructure/src/tagClasses'
import { auth } from './firebase-web-layer'

const googleAuthProvider = new GoogleAuthProvider()

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // 'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-healthcare',
] as const

for (const scope of scopes) {
  googleAuthProvider.addScope(scope)
}

const redirectToSignIn = (): Promise<never> => signInWithRedirect(getAuth(), googleAuthProvider)

const handleRedirectResult = (): Promise<import('firebase/auth').UserCredential | void> =>
  getRedirectResult(getAuth())
    .then((result) => {
      if (result === null || result === undefined) {
        throw new Error('Invalid Redirect Result')
      }
      console.log({ result })
      return result
    })
    // .then(signInResultHandler)
    .catch(handleAuthError)

const signIn = (): Promise<import('firebase/auth').UserCredential | void> =>
  signInWithPopup(auth, googleAuthProvider)
    // .then(signInResultHandler)
    .catch(handleAuthError)

const handleAuthError = (error: FirebaseError): void => {
  // Handle Errors here.
  const errorCode = error.code
  const errorMessage = error.message
  // The email of the user's account used.
  const email = error.customData?.email
  // The AuthCredential type that was used.
  const credential = GoogleAuthProvider.credentialFromError(error)
  console.error({ credential, email, errorCode, errorMessage })
}

const getOauth2FromDb = (): string | undefined => localStorage.getItem('oauth2Token') ?? undefined

const authTokenWatcher = Effect.gen(function* () {
  const { auth: firebaseAuth } = yield* FirebaseWeb
  return firebaseAuth.onIdTokenChanged((user) => {
    if (user) {
      user
        .getIdToken()
        .then(function (idToken) {
          fetch('/api/googleLogin', {
            body: JSON.stringify({}),
            headers: {
              'Content-type': 'application/json',
              authorization: `Bearer ${idToken}`,
            },
            method: 'POST',
          })
            .then((response) => response.json())
            .then((result) => {
              window.open(result.url, '_self')
            })
            .catch(function (error) {
              console.log(`failed to fetch ${error}`)
            })
        })
        .catch(function (error) {
          console.log(`couldnt get user token ${error}`)
        })
    }
  })
})

export {
  googleAuthProvider,
  redirectToSignIn,
  handleRedirectResult,
  signIn,
  getOauth2FromDb,
  authTokenWatcher,
}
