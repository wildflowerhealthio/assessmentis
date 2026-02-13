import { Context } from 'effect'
import type { OrgSlug } from '@assessmentis/platform-domain'
import type { Request } from 'firebase-functions/https'

/**
 * Run a global Effect in a Cloud Function and handle the response
 * Automatically provides FirebaseAdminLayer (FirebaseApp, FirebaseFirestore, FirebaseAuth)
 */

export class FunctionsContext extends Context.Tag('FunctionsContext')<
  FunctionsContext,
  {
    request: Request
    orgSlug?: OrgSlug
  }
>() {}
