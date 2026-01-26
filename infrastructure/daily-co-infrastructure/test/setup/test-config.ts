import 'dotenv/config'

export const testConfig = {
  apiKey: process.env.DAILYCO_API_KEY || 'test-api-key',
  dailyCoProxyUrl:
    process.env.DAILYCO_PROXY_URL || 'https://api.daily.co/v1',
}

export const DAILYCO_API_BASE = testConfig.dailyCoProxyUrl

/**
 * Build Daily.co API path
 */
export const buildApiPath = (endpoint?: string) => {
  if (!endpoint) {
    return ''
  }
  return `/${endpoint}`
}
