import type { HttpsOptions } from 'firebase-functions/https'

import { google } from 'googleapis'

/**
 * Google OAuth scopes required for the application
 */
export const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cloud-healthcare',
]

/**
 * Google OAuth2 client configuration
 */
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_ID_SECRET,
  'https://assessment.is/api/authed'
)

/**
 * Default HTTPS options for Cloud Functions
 */
export const defaultHttpOptions = {
  timeoutSeconds: 60,
  ingressSettings: 'ALLOW_ALL',
  region: 'northamerica-northeast1',
  cors: [
    /^http:\/\/localhost:5173$/,
    /assessment\.is$/,
    /.*\.assessment\.is$/,
    /assessmentis\.web\.app$/,
    /assessmentis--.*\.web\.app$/,
  ],
} satisfies HttpsOptions
