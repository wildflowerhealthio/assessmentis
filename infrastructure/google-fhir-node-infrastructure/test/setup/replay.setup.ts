import { setupServer } from 'msw/node'
import { http, HttpResponse, passthrough } from 'msw'
import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Google metadata headers required for authentication
const metadataHeaders = {
  'Metadata-Flavor': 'Google',
}

// Create handlers for Google auth metadata endpoints to return mock credentials
const authHandlers = [
  // GCE metadata server - return mock instance info and token
  http.get('http://169.254.169.254/computeMetadata/v1/instance', () => {
    return HttpResponse.json(
      { zone: 'projects/123456/zones/us-central1-a' },
      { headers: metadataHeaders }
    )
  }),
  http.get(
    'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
    () => {
      return HttpResponse.json(
        {
          access_token: 'mock-access-token-for-testing',
          expires_in: 3600,
          token_type: 'Bearer',
        },
        { headers: metadataHeaders }
      )
    }
  ),
  http.get(
    'http://169.254.169.254/computeMetadata/v1/project/project-id',
    () => {
      return HttpResponse.text('mock-project-id', { headers: metadataHeaders })
    }
  ),
  // Catch-all for any other metadata requests
  http.get('http://169.254.169.254/*', () => {
    return HttpResponse.json({}, { headers: metadataHeaders })
  }),
  // Alternative metadata endpoint
  http.get('http://metadata.google.internal./computeMetadata/v1/*', () => {
    return HttpResponse.json(
      {
        access_token: 'mock-access-token-for-testing',
        expires_in: 3600,
        token_type: 'Bearer',
      },
      { headers: metadataHeaders }
    )
  }),
]

// Create MSW server with auth handlers
export const server = setupServer(...authHandlers)

// Setup hooks for MSW
beforeAll(() => {
  server.listen({
    onUnhandledRequest: (request, print) => {
      const url = request.url
      // Warn for unhandled Healthcare API requests (we should be handling these)
      if (url.includes('healthcare.googleapis.com')) {
        print.warning()
      }
      // Silently ignore all other requests
    },
  })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

export { server as mswServer }
