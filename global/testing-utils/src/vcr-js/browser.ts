import { IS_PATCHED_MODULE } from '@mswjs/interceptors'
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { bypass, getResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'

import type { VcrOpts } from './types'

export type { VcrOpts } from './types'

/**
 * Builds MSW request handlers that proxy matching requests through a
 * Talkback server for browser-side tape recording/playback.
 */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- return type is inferred from msw handler array
export const browserHandlers = (opts: VcrOpts) => [
  ...opts.handlers,
  ...opts.hosts.map(({ destinationHost, proxyHost, proxyPort }) =>
    http.all(`${destinationHost}/*`, async ({ request: interceptedRequest }) => {
      console.log('Proxying request to talkback server:', interceptedRequest.url)
      const parsedUrl = new URL(interceptedRequest.url)
      const parsedHost = `${parsedUrl.protocol}//${parsedUrl.hostname}`
      if (parsedHost !== destinationHost) {
        console.error("Request host doesn't match expected talkback host")
        return
      }

      const talkbackRequest = new Request(
        `http://${proxyHost ?? 'localhost'}:${proxyPort}${interceptedRequest.url.slice(destinationHost.length)}`,
        {
          body: interceptedRequest.body,
          headers: interceptedRequest.headers,
          method: interceptedRequest.method,
        }
      )
      try {
        return await fetch(bypass(talkbackRequest))
      } catch (error) {
        console.error('Error proxying request to talkback server', error)
        throw error
      }
    })
  ),
]

/** Creates an MSW service worker configured with {@link browserHandlers}. */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- return type is inferred from msw setupWorker
export const setupInterceptWorker = (opts: VcrOpts) => setupWorker(...browserHandlers(opts))

/**
 * Patches `XMLHttpRequest` to intercept requests and route them through
 * the VCR handlers. No-ops if already patched. Used for environments
 * where the service worker approach isn't available.
 */
export const setXMLHttpRequestInterceptor = (opts: VcrOpts): void => {
  if (IS_PATCHED_MODULE in XMLHttpRequest && XMLHttpRequest[IS_PATCHED_MODULE]) {
    console.log('XMLHttpRequest is already patched by another interceptor', XMLHttpRequest)
    return
  }
  console.log('Patching XMLHttpRequest with interceptor', XMLHttpRequest)
  const interceptor = new XMLHttpRequestInterceptor()

  const handlers = browserHandlers(opts)
  interceptor.on('unhandledException', (error) => {
    console.error('XHR Interceptor unhandled exception', error)
  })

  interceptor.on('request', ({ request, controller }) => {
    console.log('Intercepted XHR request to', request.url)
    void getResponse(handlers, request).then((response) => {
      if (response) {
        controller.respondWith(response)
      }
    })
  })

  interceptor.apply()

  console.log('XMLHttpRequest patched', XMLHttpRequest)
}
