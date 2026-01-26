import { http, HttpResponse } from 'msw'
import { GOOGLE_HEALTHCARE_BASE, buildApiPath } from '../setup/test-config'

export interface FhirFixture<T = unknown> {
  request: {
    method: string
    resourceType: string
    id?: string
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
 * Create a read handler that returns the fixture response
 */
export const createReadHandler = <T>(
  resourceType: string,
  id: string,
  fixture: FhirFixture<T>
) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.get(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a search handler (Google Healthcare uses POST for _search)
 */
export const createSearchHandler = <T>(
  resourceType: string,
  fixture: FhirFixture<T>
) => {
  // Google Healthcare API uses POST to /{resourceType}/_search
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType)}/_search`

  return http.post(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a create handler
 */
export const createCreateHandler = <T>(
  resourceType: string,
  fixture: FhirFixture<T>
) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType)}`

  return http.post(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create an update handler
 */
export const createUpdateHandler = <T>(
  resourceType: string,
  id: string,
  fixture: FhirFixture<T>
) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.put(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a delete handler
 */
export const createDeleteHandler = (resourceType: string, id: string) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.delete(path, () => {
    return new HttpResponse(null, { status: 200 })
  })
}

/**
 * Create a bundle execution handler
 */
export const createBundleHandler = <T>(fixture: FhirFixture<T>) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath()}`

  return http.post(path, () => {
    return HttpResponse.json(fixture.response.body, {
      status: fixture.response.status,
    })
  })
}

/**
 * Create a not found handler for any resource
 */
export const createNotFoundHandler = (resourceType: string, id: string) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: {
          code: 404,
          message: `Resource ${resourceType}/${id} not found`,
          status: 'NOT_FOUND',
        },
      },
      { status: 404 }
    )
  })
}

/**
 * Create a 401 unauthorized handler
 */
export const createUnauthorizedHandler = (resourceType: string, id: string) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: {
          code: 401,
          message: 'Request is missing required authentication credential',
          status: 'UNAUTHENTICATED',
        },
      },
      { status: 401 }
    )
  })
}

/**
 * Create a 403 forbidden handler
 */
export const createForbiddenHandler = (resourceType: string, id: string) => {
  const path = `${GOOGLE_HEALTHCARE_BASE}${buildApiPath(resourceType, id)}`

  return http.get(path, () => {
    return HttpResponse.json(
      {
        error: {
          code: 403,
          message: 'Permission denied',
          status: 'PERMISSION_DENIED',
        },
      },
      { status: 403 }
    )
  })
}
