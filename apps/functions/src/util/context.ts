import { AppOptions } from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsOptions } from 'firebase-functions/https'
import { google } from 'googleapis'

const firebaseConfig = {
  projectId: 'assessmentis',
  storageBucket: 'assessmentis.firebasestorage.app',
} satisfies AppOptions

export const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // 'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-healthcare',
]

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_ID_SECRET,
  'https://assessment.is/api/authed'
)

export const defaultHttpOptions = {
  timeoutSeconds: 60,
  ingressSettings: 'ALLOW_ALL',
  cors: [
    /^http:\/\/localhost:5173$/,
    /assessment\.is$/,
    /.*\.assessment\.is$/,
    /assessmentis\.web\.app$/,
    /assessmentis--.*\.web\.app$/,
  ],
} satisfies HttpsOptions

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app, 'assessmentis')
db.settings({ ignoreUndefinedProperties: true })
