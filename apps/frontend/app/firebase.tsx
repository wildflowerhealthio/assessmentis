import {
  FirebaseError,
  initializeApp,
  type FirebaseOptions,
} from 'firebase/app'
import {
  GoogleAuthProvider,
  UserCredential,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { useEffect } from 'react'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyApjnjc-e4lKXujxcj6Iq4HOgTHHY-2srU',
  authDomain: 'assessment-is-sandbox.firebaseapp.com',
  projectId: 'assessment-is-sandbox',
  storageBucket: 'assessment-is-sandbox.firebasestorage.app',
  messagingSenderId: '581867958758',
  appId: '1:581867958758:web:1e8ab38f0397d9707c6627',
} satisfies FirebaseOptions
// Initialize Firebase

export const app = initializeApp(firebaseConfig)
app.automaticDataCollectionEnabled = false

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

export const googleAuthProvider = new GoogleAuthProvider()

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-healthcare',
] as const
for (const scope of scopes) {
  googleAuthProvider.addScope(scope)
}

export const initGapi = async (token: string) => {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_API_KEY
  gapi.client.setApiKey(apiKey)
  gapi.client.setToken({ access_token: token })
  await gapi.client.load(
    'https://healthcare.googleapis.com/$discovery/rest?version=v1'
  )
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
    .then(signInResultHandler)
    .catch(handleAuthError)

export const signIn = () =>
  signInWithPopup(auth, googleAuthProvider)
    .then(signInResultHandler)
    .catch(handleAuthError)

const signInResultHandler = async (result: UserCredential) => {
  // This gives you a Google Access Token. You can use it to access the Google API.
  const credential = GoogleAuthProvider.credentialFromResult(result)
  const token = credential?.accessToken

  if (token) {
    await new Promise<void>((resolve) => {
      if (gapi.client) {
        gapi.client.setToken({
          access_token: token,
        })
        resolve()
      } else {
        gapi.load('client', async () => {
          await initGapi(token)
          resolve()
        })
      }
    })
    await setOauth2FromDb(token)
  }

  console.log({ result, credential })
}

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
          return
        }
        if (gapi.client) {
          gapi.client.setToken({ access_token: token })
        } else {
          gapi.load('client', () => initGapi(token))
        }
      }
    })
  }, [])
