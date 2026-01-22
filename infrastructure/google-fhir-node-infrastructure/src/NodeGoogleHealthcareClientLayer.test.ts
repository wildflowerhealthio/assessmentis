import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { HttpResponse, createFhirResponseHandlers } from '@assessmentis/fhir-client'

describe('NodeGoogleHealthcareClientLayer', () => {
  describe('FhirResponseHandlers Integration', () => {
    it('should handle successful responses through multiple handlers', () => {
      const handlers = createFhirResponseHandlers<HttpResponse>()
      
      const response: HttpResponse<{ id: string }> = {
        status: 200,
        data: { id: 'test-id' },
      }

      const result = Effect.runSync(
        handlers.handleReadResponse(response, {
          resourceType: 'Patient',
          id: 'test-id',
        })
      )

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'test-id' })
    })

    it('should handle search responses', () => {
      const handlers = createFhirResponseHandlers<HttpResponse>()
      
      const response: HttpResponse<{ resourceType: string }> = {
        status: 200,
        data: { resourceType: 'Bundle' },
      }

      const result = Effect.runSync(handlers.handleSearchResponse(response))

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ resourceType: 'Bundle' })
    })
  })
})
