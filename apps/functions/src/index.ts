import { setGlobalOptions } from 'firebase-functions'

setGlobalOptions({ region: 'northamerica-northeast2' })

export * from './functions/dailyco'
export * from './functions/googleLogin'
export * from './functions/oAuthCallback'
export * from './functions/refreshGoogleOAuthToken'
export * from './functions/syncDailyCoRecordings'
