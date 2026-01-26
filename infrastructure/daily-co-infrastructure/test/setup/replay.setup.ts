import { setupServer } from 'msw/node'
import { beforeAll, afterAll, afterEach } from 'vitest'

// Create MSW server with no default handlers
// Handlers will be added by individual tests
export const server = setupServer()

// Setup hooks for MSW
beforeAll(() => {
  server.listen({
    onUnhandledRequest: (request, print) => {
      const url = request.url
      // Warn for unhandled Daily.co API requests (we should be handling these)
      if (url.includes('api.daily.co')) {
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
