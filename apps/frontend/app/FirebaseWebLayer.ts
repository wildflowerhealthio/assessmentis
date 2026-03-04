import { Layer } from 'effect'

import { FirebaseWeb } from '@assessmentis/firebase-web-infrastructure'

import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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

export const FirebaseWebLayer = Layer.succeed(FirebaseWeb, {
  app,
  auth,
  firestore: db,
})
