import { createUserPlatformService } from '@assessmentis/firebase-web-infrastructure'
import { Effect } from 'effect'
import {
  FirebaseError,
  initializeApp,
  type FirebaseOptions,
} from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

import { useEffect } from 'react'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC1OAnpn5Aj6EQqnDNCKI4b26CgHm_-aTc',
  authDomain: 'assessmentis.firebaseapp.com',
  projectId: 'assessmentis',
  storageBucket: 'assessmentis.firebasestorage.app',
  messagingSenderId: '363489601410',
  appId: '1:363489601410:web:5a39eb160d09c84fae519b',
} satisfies FirebaseOptions
// Initialize Firebase

export const app = initializeApp(firebaseConfig)
app.automaticDataCollectionEnabled = false

export const db = getFirestore(app, 'assessmentis')

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

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

export const setOauth2FromDb = (authToken: string | undefined) => {
  if (authToken === undefined) {
    localStorage.removeItem('oauth2Token')
    return
  }
  localStorage.setItem('oauth2Token', authToken)
}

export const getOauth2FromDb = () => {
  return localStorage.getItem('oauth2Token') ?? undefined
}

export const useAuthedGapi = () =>
  useEffect(() => {
    return auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await getOauth2FromDb()
        if (!token) {
          signOut(auth)

          if (auth.currentUser) {
            auth.currentUser
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
          }

          return
        }
      }
    })
  }, [])

export const platform = Effect.runSync(createUserPlatformService(app, auth, db))
