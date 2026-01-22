import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { NotFoundError } from '@assessmentis/ontology'
import { HttpResponse } from '@assessmentis/util'
import { handleAuthErr, handleAuthzErr, handleNotFoundErr } from './errorHandlers'

describe('errorHandlers', () => {
  describe('handleAuthErr', () => {
    it('should fail on 401 status', () => {
      const response: HttpResponse = {
        status: 401,
        statusText: 'Unauthorized',
        data: null,
      }

      expect(() => {
        Effect.runSync(Effect.succeed(response).pipe(handleAuthErr))
      }).toThrow('Unauthorized access to FHIR resource')
    })

    it('should pass through non-401 status', () => {
      const response: HttpResponse<{ id: string }> = {
        status: 200,
        data: { id: 'test-123' },
      }

      const result = Effect.runSync(Effect.succeed(response).pipe(handleAuthErr))
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'test-123' })
    })
  })

  describe('handleAuthzErr', () => {
    it('should fail on 403 status', () => {
      const response: HttpResponse = {
        status: 403,
        statusText: 'Forbidden',
        data: null,
      }

      expect(() => {
        Effect.runSync(Effect.succeed(response).pipe(handleAuthzErr))
      }).toThrow('Forbidden access to FHIR resource')
    })

    it('should pass through non-403 status', () => {
      const response: HttpResponse<{ id: string }> = {
        status: 200,
        data: { id: 'test-123' },
      }

      const result = Effect.runSync(Effect.succeed(response).pipe(handleAuthzErr))
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'test-123' })
    })
  })

  describe('handleNotFoundErr', () => {
    it('should fail on 404 status', () => {
      const response: HttpResponse = {
        status: 404,
        statusText: 'Not Found',
        data: null,
      }

      const handler = handleNotFoundErr({ resourceType: 'Patient', id: 'patient-123' })

      expect(() => {
        Effect.runSync(Effect.succeed(response).pipe(handler))
      }).toThrow()
    })

    it('should fail on 410 status', () => {
      const response: HttpResponse = {
        status: 410,
        statusText: 'Gone',
        data: null,
      }

      const handler = handleNotFoundErr({ resourceType: 'Observation', id: 'obs-456' })

      expect(() => {
        Effect.runSync(Effect.succeed(response).pipe(handler))
      }).toThrow()
    })

    it('should pass through non-404/410 status', () => {
      const response: HttpResponse<{ id: string }> = {
        status: 200,
        data: { id: 'test-123' },
      }

      const handler = handleNotFoundErr({ resourceType: 'Patient', id: 'patient-123' })
      const result = Effect.runSync(Effect.succeed(response).pipe(handler))
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: 'test-123' })
    })

    it('should pass through 500 error without catching it', () => {
      const response: HttpResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        data: null,
      }

      const handler = handleNotFoundErr({ resourceType: 'Patient', id: 'patient-123' })
      const result = Effect.runSync(Effect.succeed(response).pipe(handler))
      expect(result.status).toBe(500)
    })
  })
})
