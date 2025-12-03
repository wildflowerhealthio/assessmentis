import { HttpClient, HttpBody } from "@effect/platform";
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth'
import { useEffect, useState } from "react";
import { useRuntimeContext, type ClientRuntimeContext } from "./clientRuntime";
import { Effect } from "effect";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApjnjc-e4lKXujxcj6Iq4HOgTHHY-2srU",
  authDomain: "assessment-is-sandbox.firebaseapp.com",
  projectId: "assessment-is-sandbox",
  storageBucket: "assessment-is-sandbox.firebasestorage.app",
  messagingSenderId: "581867958758",
  appId: "1:581867958758:web:1e8ab38f0397d9707c6627",
} satisfies FirebaseOptions;
// Initialize Firebase

export const app = initializeApp(firebaseConfig);
app.automaticDataCollectionEnabled = false


// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cloud-platform",
  'https://www.googleapis.com/auth/cloud-healthcare',
] as const
for (const scope of scopes) {
  googleAuthProvider.addScope(scope)
}

const initGapi = async (token: string) => {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_API_KEY
  gapi.client.setApiKey(apiKey)
  gapi.client.setToken({access_token: token})
  await gapi.client.load('https://healthcare.googleapis.com/$discovery/rest?version=v1')
}

export const signIn = () => signInWithPopup(auth, googleAuthProvider)
  .then(async (result) => {
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (token) {
      await new Promise<void>((resolve, reject) => {
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
      });
      await setOauth2FromDb(token)
    }

    console.log({result, credential})
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.error({errorCode, errorMessage, email, credential})
  });

const setOauth2FromDb = (authToken: string | undefined)=> {
  if (authToken === undefined) {
    localStorage.removeItem('oauth2Token')
    return
  }
  localStorage.setItem('oauth2Token', authToken)
}

const getOauth2FromDb =  () => {
  return localStorage.getItem('oauth2Token') ?? undefined
}

export const LoginButton = () => {
  const [[label, action, disabled], setLabelAndAction] = useState<
    [string, undefined | (() => void), boolean]
    >(['Logout', undefined, true])

  useEffect(
    () => {
      return auth.onIdTokenChanged((maybeUser) => {
        if (maybeUser) {
          setLabelAndAction(["Logout", () => {
            signOut(auth)
            
        }, false])
        } else {
          setLabelAndAction(['Login', () => {
            signIn()
        }, false])
        }
      })
  }, []);

  useEffect(() => {
    return auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await getOauth2FromDb();
        if (!token) {
          // signOut(auth);
          return
        }
        if (gapi.client) {
          gapi.client.setToken({access_token: token})
        } else {
          gapi.load('client', () => initGapi(token))
        }
      } else {
        setOauth2FromDb(undefined)
      }
    });
  }, []) 

  const clientRuntime = useRuntimeContext()

  return (
    <>
      <button
        className="button-2"
        style={{width: 90, margin: 'auto'}}
        onClick={action} 
        disabled={disabled}
      >
        {label}
      </button>
    </>
  )
}