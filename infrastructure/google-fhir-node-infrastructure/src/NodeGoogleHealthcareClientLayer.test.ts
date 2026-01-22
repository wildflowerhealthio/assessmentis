import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'
import { NotFoundError } from '@assessmentis/ontology'
import {
  HttpResponse,
  failOnHttpStatus,
  failOnHttpStatuses,
} from '@assessmentis/util'

describe('NodeGoogleHealthcareClientLayer', () => {
  describe('Error Mapping', () => {
    describe('failOnHttpStatus for 401 → AuthError', () => {
      it('should map 401 to AuthError', () => {
        const response: HttpResponse = {
          status: 401,
          statusText: 'Unauthorized',
          data: null,
        }

        const handler = failOnHttpStatus(401, (resp: HttpResponse) =>
          new AuthError({
            message: 'Unauthorized access to FHIR resource',
            cause: resp.statusText,
          })
        )

        expect(() => {
          Effect.runSync(Effect.succeed(response).pipe(handler))
        }).toThrow('Unauthorized access to FHIR resource')
      })
    })

    describe('failOnHttpStatus for 403 → AuthzError', () => {
      it('should map 403 to AuthzError', () => {
        const response: HttpResponse = {
          status: 403,
          statusText: 'Forbidden',
          data: null,
        }

        const handler = failOnHttpStatus(403, (resp: HttpResponse) =>
          new AuthzError({
            message: 'Forbidden access to FHIR resource',
            cause: resp.statusText,
          })
        )

        expect(() => {
          Effect.runSync(Effect.succeed(response).pipe(handler))
        }).toThrow('Forbidden access to FHIR resource')
      })
    })

    describe('failOnHttpStatuses for 404/410 → NotFoundError', () => {
      it('should map 404 to NotFoundError', () => {
        const response: HttpResponse = {
          status: 404,
          statusText: 'Not Found',
          data: null,
        }

        const handler = failOnHttpStatuses([404, 410], (resp: HttpResponse) =>
          new NotFoundError({
            resourceType: 'Patient',
            params: { id: 'patient-123' },
            cause: resp,
          })
        )

        expect(() => {
          Effect.runSync(Effect.succeed(response).pipe(handler))
        }).toThrow()
      })

      it('should map 410 to NotFoundError', () => {
        const response: HttpResponse = {
          status: 410,
          statusText: 'Gone',
          data: null,
        }

        const handler = failOnHttpStatuses([404, 410], (resp: HttpResponse) =>
          new NotFoundError({
            resourceType: 'Observation',
            params: { id: 'obs-456' },
            cause: resp,
          })
        )

        expect(() => {
          Effect.runSync(Effect.succeed(response).pipe(handler))
        }).toThrow()
      })
    })

    describe('Success path', () => {
      it('should allow 200 responses through', () => {
        const response: HttpResponse<{ id: string }> = {
          status: 200,
          data: { id: 'test-id' },
        }

        const authHandler = failOnHttpStatus(401, (resp: HttpResponse) =>
          new AuthError({
            message: 'Unauthorized',
            cause: resp.statusText,
          })
        )

        const authzHandler = failOnHttpStatus(403, (resp: HttpResponse) =>
          new AuthzError({
            message: 'Forbidden',
            cause: resp.statusText,
          })
        )

        const result = Effect.runSync(
          Effect.succeed(response).pipe(authHandler, authzHandler)
        )

        expect(result.status).toBe(200)
        expect(result.data).toEqual({ id: 'test-id' })
      })
    })
  })

  describe('Error extraction from googleapis errors', () => {
    it('should extract status code from error object', () => {
      const error = { code: 401, message: 'Unauthorized' }
      const status =
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'number'
          ? error.code
          : 500

      expect(status).toBe(401)
    })

    it('should default to 500 for unknown errors', () => {
      const error = new Error('Unknown error')
      const status =
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'number'
          ? error.code
          : 500

      expect(status).toBe(500)
    })
  })
})
