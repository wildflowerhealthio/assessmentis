import { ManagedRuntime, Schema, Either } from 'effect'
import { makeRuntime } from './clientRuntime'
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
import { doc, getFirestore, onSnapshot } from 'firebase/firestore'

import { useEffect } from 'react'
import { ClientRuntimeContext } from './clientRuntime'

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

export const db = getFirestore(app, 'assessmentis-sandbox')

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

export const PublicOrgConfigSchema = Schema.Struct({
  google_fhir: Schema.Struct({
    project_id: Schema.String,
    region: Schema.String,
    dataset: Schema.String,
    store_id: Schema.String,
  }),
})

export const decodeGoogleFhirConfig = Schema.decodeUnknownEither(
  PublicOrgConfigSchema
)

export const subscribeToRuntime = (
  onReady: (
    runtime: ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never> | null
  ) => void
) => {
  let unsubscribePublicOrgConfig: null | (() => void) = null
  let unsubscribeUser: null | (() => void) = null
  const unsubscribeIdToken = auth.onIdTokenChanged((user) => {
    console.log('Auth state changed, user:', user)
    if (user) {
      unsubscribeUser?.()
      console.log('Subscribing to user document for uid:', user.uid)
      unsubscribeUser = onSnapshot(
        doc(db, 'users', user.uid),
        (userSnapshot) => {
          const userData = userSnapshot.data()
          console.log('Loaded user document for uid:', user.uid, userData)
          if (!userData) {
            console.error('No user document found for uid:', user.uid)
            return
          }
          if ('org_roles' in userData) {
            const orgsAndRoles = Object.entries(userData.org_roles)
            if (orgsAndRoles.length != 1) {
              console.warn(
                'User does not have one, single orgs, this is unsupported:',
                orgsAndRoles
              )
            }
            const [orgId, _roles] = orgsAndRoles[0]
            unsubscribePublicOrgConfig?.()
            unsubscribePublicOrgConfig = onSnapshot(
              doc(db, 'public_org_configs', orgId),
              (orgConfigSnapshot) => {
                console.log('Loaded org config for orgId:', orgId)
                const orgConfigData = orgConfigSnapshot.data()
                if (!orgConfigData) {
                  console.error(
                    'No org config document found for orgId:',
                    orgId
                  )
                  return
                }
                const orgConfigEither = decodeGoogleFhirConfig(orgConfigData)
                orgConfigEither.pipe(
                  Either.match({
                    onLeft: (err) => {
                      console.error(
                        'Invalid org config schema for orgId:',
                        orgId,
                        err
                      )
                    },
                    onRight: (config) => {
                      console.log(
                        'Decoded org config for orgId:',
                        orgId,
                        config
                      )
                      onReady(
                        makeRuntime({
                          PUBLIC_GOOGLE_FHIR_REGION: config.google_fhir.region,
                          PUBLIC_GOOGLE_FHIR_PROJECT_ID:
                            config.google_fhir.project_id,
                          PUBLIC_GOOGLE_FHIR_DATASET:
                            config.google_fhir.dataset,
                          PUBLIC_GOOGLE_FHIR_STORE_ID:
                            config.google_fhir.store_id,
                        })
                      )
                    },
                  })
                )
              }
            )
          }
        },
        (error) => {
          console.error('Error fetching user document:', error)
        }
      )
    }
  })
  return () => {
    unsubscribeIdToken()
    unsubscribeUser?.()
    unsubscribePublicOrgConfig?.()
  }
}

export const getRuntime = () =>
  new Promise<ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>>(
    (resolve) => {
      const unsubscribe = subscribeToRuntime((runtime) => {
        if (runtime !== null) {
          resolve(runtime)
          unsubscribe()
        }
      })
    }
  )
