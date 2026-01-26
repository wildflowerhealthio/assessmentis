import { Layer, Effect } from 'effect'
import { DailyCoProxyConfig } from '@assessmentis/config-domain'
import { AuthDataService } from '@assessmentis/platform-domain'
import { DailyCoExternalVideoCallClientLayer } from '../../src/DailyCoExternalVideoCallClientLayer'
import { testConfig } from './test-config'

/**
 * Verify that Daily.co API key is configured
 */
export const verifyDailyCoApiKey = (): void => {
  if (
    !testConfig.apiKey ||
    testConfig.apiKey === 'test-api-key' ||
    testConfig.apiKey.length === 0
  ) {
    throw new Error(
      'Daily.co API key not configured. Please set DAILYCO_API_KEY in .env file.\n' +
        'Get your API key from https://dashboard.daily.co/developers'
    )
  }
}

/**
 * Mock AuthDataService that provides the Daily.co API key as auth token
 */
const MockAuthDataServiceLayer = Layer.succeed(AuthDataService, {
  authData: Effect.succeed({
    authToken: testConfig.apiKey,
    authClaims: {} as never,
  }),
})

/**
 * Mock DailyCoProxyConfig for testing
 */
const mockDailyCoConfig: DailyCoProxyConfig = {
  _tag: 'dailyco_proxy',
  dailyCoProxyUrl: testConfig.dailyCoProxyUrl,
  recordingsBucket: undefined,
}

/**
 * Create the live test layer with real Daily.co API
 */
export const LiveTestLayer = DailyCoExternalVideoCallClientLayer(
  mockDailyCoConfig
).pipe(Layer.provide(MockAuthDataServiceLayer))

export { testConfig }
