import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import {
  HttpResponse,
  failOnHttpStatus,
  failOnHttpStatuses,
} from './httpResponseHandlers'

describe('httpResponseHandlers', () => {
  describe('failOnHttpStatus', () => {
    it('should succeed when status does not match', () => {
      const response: HttpResponse<string> = {
        status: 200,
        statusText: 'OK',
        data: 'test data',
      }

      const handler = failOnHttpStatus(404, (resp) => `Not found: ${resp.status}`)
      const result = Effect.runSync(
        Effect.succeed(response).pipe(handler)
      )

      expect(result).toEqual(response)
    })

    it('should fail when status matches', () => {
      const response: HttpResponse<string> = {
        status: 404,
        statusText: 'Not Found',
        data: '',
      }

      const handler = failOnHttpStatus(404, (resp) => `Not found: ${resp.status}`)

      expect(() =>
        Effect.runSync(Effect.succeed(response).pipe(handler))
      ).toThrow('Not found: 404')
    })

    it('should pass error from makeError function', () => {
      const response: HttpResponse = {
        status: 401,
        statusText: 'Unauthorized',
        data: null,
      }

      const customError = new Error('Custom auth error')
      const handler = failOnHttpStatus(401, () => customError)

      expect(() =>
        Effect.runSync(Effect.succeed(response).pipe(handler))
      ).toThrow('Custom auth error')
    })
  })

  describe('failOnHttpStatuses', () => {
    it('should succeed when status does not match any in the list', () => {
      const response: HttpResponse<{ id: string }> = {
        status: 200,
        data: { id: 'test-id' },
      }

      const handler = failOnHttpStatuses(
        [404, 410],
        (resp) => `Not found: ${resp.status}`
      )
      const result = Effect.runSync(
        Effect.succeed(response).pipe(handler)
      )

      expect(result).toEqual(response)
    })

    it('should fail when status matches first in list', () => {
      const response: HttpResponse = {
        status: 404,
        data: null,
      }

      const handler = failOnHttpStatuses(
        [404, 410],
        (resp) => `Not found: ${resp.status}`
      )

      expect(() =>
        Effect.runSync(Effect.succeed(response).pipe(handler))
      ).toThrow('Not found: 404')
    })

    it('should fail when status matches last in list', () => {
      const response: HttpResponse = {
        status: 410,
        data: null,
      }

      const handler = failOnHttpStatuses(
        [404, 410],
        (resp) => `Gone: ${resp.status}`
      )

      expect(() =>
        Effect.runSync(Effect.succeed(response).pipe(handler))
      ).toThrow('Gone: 410')
    })
  })
})
