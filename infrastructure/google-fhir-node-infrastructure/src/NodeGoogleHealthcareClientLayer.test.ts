import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { HttpResponse } from '@assessmentis/util'
import { handleAuthErr, handleAuthzErr } from './errorHandlers'

describe('NodeGoogleHealthcareClientLayer', () => {
  describe('Error Mapping Integration', () => {
    describe('Success path', () => {
      it('should allow 200 responses through multiple handlers', () => {
        const response: HttpResponse<{ id: string }> = {
          status: 200,
          data: { id: 'test-id' },
        }

        const result = Effect.runSync(
          Effect.succeed(response).pipe(handleAuthErr, handleAuthzErr)
        )

        expect(result.status).toBe(200)
        expect(result.data).toEqual({ id: 'test-id' })
      })
    })
  })
})
