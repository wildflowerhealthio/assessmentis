import { http, HttpResponse } from 'msw'
import { DAILYCO_API_BASE } from '../setup/test-config'

export interface DailyCoFixture<T = unknown> {
  request: {
    method: string
    endpoint: string
    params?: Record<string, string>
    body?: unknown
  }
  response: {
    status: number
    body: T
  }
  metadata?: {
    recordedAt: string
    description?: string
  }
}

/**
 * Create a room creation handler
 */
export const createRoomHandler = <T>(fixture: DailyCoFixture<T>) => {
  const path = `${DAILYCO_API_BASE}/rooms`

  return http.post(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a recordings list handler
 */
export const createRecordingsHandler = <T>(fixture: DailyCoFixture<T>) => {
  const path = `${DAILYCO_API_BASE}/recordings`

  return http.get(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a recording access link handler
 */
export const createRecordingLinkHandler = <T>(
  recordingId: string,
  fixture: DailyCoFixture<T>
) => {
  const path = `${DAILYCO_API_BASE}/recordings/${recordingId}/access-link`

  return http.get(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a not found handler for any endpoint
 */
export const createNotFoundHandler = (endpoint: string) => {
  const path = `${DAILYCO_API_BASE}/${endpoint}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: 'not-found',
        info: `${endpoint} not found`,
      },
      { status: 404 }
    )
  })
}

/**
 * Create a 401 unauthorized handler
 */
export const createUnauthorizedHandler = (endpoint: string) => {
  const path = `${DAILYCO_API_BASE}/${endpoint}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: 'unauthorized',
        info: 'Invalid API key',
      },
      { status: 401 }
    )
  })
}

/**
 * Create a 403 forbidden handler
 */
export const createForbiddenHandler = (endpoint: string) => {
  const path = `${DAILYCO_API_BASE}/${endpoint}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: 'forbidden',
        info: 'Insufficient permissions',
      },
      { status: 403 }
    )
  })
}
