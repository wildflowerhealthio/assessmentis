import 'dotenv/config'
import { http } from 'msw'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupNodeIntercepting } from '@assessmentis/testing-utils/vcr-js/node'
import type { DailyCoConfig } from '@assessmentis/config-domain'

export const DAILY_CO_API_BASE = 'https://api.daily.co'

/**
 * Test configuration for Daily.co API
 * Uses environment variables for real API access in record mode
 */
export const testConfig: DailyCoConfig = {
  _tag: 'daily_co' as const,
  dailyCoProxyUrl: 'https://api.daily.co/v1',
  recordingsBucket: undefined,
}

const isRecordMode = process.env.RECORD === 'true'

/**
 * Get Daily.co API key from environment.
 * Required in record mode, uses placeholder in playback mode.
 */
export const getDailyCoApiKey = (): string => {
  const apiKey = process.env.DAILY_CO_API_KEY
  if (!apiKey && isRecordMode) {
    throw new Error(
      'DAILY_CO_API_KEY environment variable is required for recording.\n' +
        'Set it in your .env file or environment.'
    )
  }
  return apiKey ?? 'playback-mode-token'
}

/**
 * Verify Daily.co API key is configured (only enforced in record mode)
 */
export const verifyDailyCoAuth = (): void => {
  if (isRecordMode) {
    getDailyCoApiKey()
    console.log('Recording mode enabled - will record new tapes')
  }
}

// Create mock handlers for any endpoints that should be mocked rather than recorded
const mockHandlers: Parameters<typeof http.get>[] = []

const mswServer = await setupNodeIntercepting({
  summary: true,
  tapePath: __dirname + '/../tapes/',
  handlers: mockHandlers.map(([path, handler]) => http.get(path, handler)),
  hosts: [
    {
      name: 'Daily.co API',
      destinationHost: 'https://api.daily.co',
      urlSubstitutions: [
        // Replace room IDs (alphanumeric with dashes)
        [/\/rooms\/[a-zA-Z0-9-]+(?=\/|$)/g, '/rooms/:roomName'],
        // Replace recording IDs (UUIDs)
        [
          /\/recordings\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
          '/recordings/:recordingId',
        ],
        // Replace transcript IDs
        [
          /\/transcript\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
          '/transcript/:transcriptId',
        ],
        // Normalize slashes for tape file names
        [/\//g, '__'],
      ],
    },
  ],
})

// Setup hooks for MSW
beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  mswServer.resetHandlers()
})

afterAll(() => {
  mswServer.close()
})
