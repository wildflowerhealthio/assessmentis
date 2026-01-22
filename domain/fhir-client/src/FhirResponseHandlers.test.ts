import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { NotFoundError } from '@assessmentis/ontology'
import { HttpResponse, createFhirResponseHandlers } from './FhirResponseHandlers'

describe('FhirResponseHandlers', () => {
  const handlers = createFhirResponseHandlers<HttpResponse>()

  describe('handleReadResponse', () => {
    it('should pass through 200 responses', () => {
      const response: HttpResponse = {
        status: 200,
        data: { id: 'test-123' },
      }

      const result = Effect.runSync(
        handlers.handleReadResponse(response, {
          resourceType: 'Patient',
          id: 'test-123',
        })
      )

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'test-123' })
    })

    it('should fail on 401 status', () => {
      const response: HttpResponse = {
        status: 401,
        statusText: 'Unauthorized',
        data: null,
      }

      expect(() => {
        Effect.runSync(
          handlers.handleReadResponse(response, {
            resourceType: 'Patient',
            id: 'test-123',
          })
        )
      }).toThrow('Unauthorized access to FHIR resource')
    })

    it('should fail on 403 status', () => {
      const response: HttpResponse = {
        status: 403,
        statusText: 'Forbidden',
        data: null,
      }

      expect(() => {
        Effect.runSync(
          handlers.handleReadResponse(response, {
            resourceType: 'Patient',
            id: 'test-123',
          })
        )
      }).toThrow('Forbidden access to FHIR resource')
    })

    it('should fail on 404 status', () => {
      const response: HttpResponse = {
        status: 404,
        statusText: 'Not Found',
        data: null,
      }

      expect(() => {
        Effect.runSync(
          handlers.handleReadResponse(response, {
            resourceType: 'Patient',
            id: 'test-123',
          })
        )
      }).toThrow()
    })

    it('should pass through 500 status', () => {
      const response: HttpResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        data: null,
      }

      const result = Effect.runSync(
        handlers.handleReadResponse(response, {
          resourceType: 'Patient',
          id: 'test-123',
        })
      )

      expect(result.status).toBe(500)
    })
  })

  describe('handleSearchResponse', () => {
    it('should pass through 200 responses', () => {
      const response: HttpResponse = {
        status: 200,
        data: { resourceType: 'Bundle' },
      }

      const result = Effect.runSync(handlers.handleSearchResponse(response))

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ resourceType: 'Bundle' })
    })

    it('should fail on 401 status', () => {
      const response: HttpResponse = {
        status: 401,
        statusText: 'Unauthorized',
        data: null,
      }

      expect(() => {
        Effect.runSync(handlers.handleSearchResponse(response))
      }).toThrow('Unauthorized access to FHIR resource')
    })

    it('should pass through non-401/403 status codes', () => {
      const response: HttpResponse = {
        status: 200,
        data: { test: 'data' },
      }

      const result = Effect.runSync(handlers.handleSearchResponse(response))
      expect(result.status).toBe(200)
    })
  })

  describe('handleCreateResponse', () => {
    it('should pass through 201 responses', () => {
      const response: HttpResponse = {
        status: 201,
        data: { id: 'new-resource' },
      }

      const result = Effect.runSync(handlers.handleCreateResponse(response))

      expect(result.status).toBe(201)
      expect(result.data).toEqual({ id: 'new-resource' })
    })
  })

  describe('handleUpdateResponse', () => {
    it('should pass through 200 responses', () => {
      const response: HttpResponse = {
        status: 200,
        data: { id: 'updated' },
      }

      const result = Effect.runSync(
        handlers.handleUpdateResponse(response, {
          resourceType: 'Patient',
          id: 'test-123',
        })
      )

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'updated' })
    })

    it('should fail on 404 status', () => {
      const response: HttpResponse = {
        status: 404,
        statusText: 'Not Found',
        data: null,
      }

      expect(() => {
        Effect.runSync(
          handlers.handleUpdateResponse(response, {
            resourceType: 'Patient',
            id: 'test-123',
          })
        )
      }).toThrow()
    })
  })

  describe('handleDeleteResponse', () => {
    it('should pass through 204 responses', () => {
      const response: HttpResponse = {
        status: 204,
        data: null,
      }

      const result = Effect.runSync(
        handlers.handleDeleteResponse(response, {
          resourceType: 'Patient',
          id: 'test-123',
        })
      )

      expect(result.status).toBe(204)
    })

    it('should fail on 410 status', () => {
      const response: HttpResponse = {
        status: 410,
        statusText: 'Gone',
        data: null,
      }

      expect(() => {
        Effect.runSync(
          handlers.handleDeleteResponse(response, {
            resourceType: 'Patient',
            id: 'test-123',
          })
        )
      }).toThrow()
    })
  })

  describe('handleExecuteBundleResponse', () => {
    it('should pass through 200 responses', () => {
      const response: HttpResponse = {
        status: 200,
        data: { resourceType: 'Bundle', type: 'transaction-response' },
      }

      const result = Effect.runSync(
        handlers.handleExecuteBundleResponse(response)
      )

      expect(result.status).toBe(200)
      expect(result.data).toEqual({
        resourceType: 'Bundle',
        type: 'transaction-response',
      })
    })
  })
})
