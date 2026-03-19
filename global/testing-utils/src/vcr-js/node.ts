import { HttpResponse, http, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import type { SetupServerApi } from 'msw/node'
import talkback from 'talkback/es6'

import type { SpecIterableIterator } from 'undici-types/fetch'
import { vcrOptsTalkbackOptions } from './types'
import type { VcrOpts, VcrServerOpts } from './types'

export type { VcrServerOpts } from './types'

/** Starts Talkback proxy servers for each configured host (server-side recording mode). */
export const startProxyServer = async (opts: VcrServerOpts): Promise<void> => {
  const servers = vcrOptsTalkbackOptions(opts).map((talkbackOpts) =>
    talkback({ ...talkbackOpts, debug: true, silent: false })
  )
  await Promise.all(
    servers.map((server, i) =>
      server.start(() => {
        console.log(`\nTalkback server #${i + 1} started\n`)
      })
    )
  )
}

/**
 * Sets up MSW server-side request interception, routing matched requests
 * through Talkback for tape recording/playback.
 *
 * @returns A `SetupServerApi` with handlers already registered. Call
 *   `.listen()` before your test suite and `.close()` after to activate it.
 */
export const setupNodeIntercepting = async (opts: VcrOpts): Promise<SetupServerApi> => {
  const requestHandlers = await Promise.all(
    vcrOptsTalkbackOptions(opts).map((requestHandlerOpts) =>
      talkback.requestHandler(requestHandlerOpts)
    )
  )
  const proxiedThroughTalkback = 'X-Proxied-Through-Talkback'

  return setupServer(
    ...opts.handlers,
    ...opts.hosts.map(({ destinationHost }, handlerIndex) =>
      http.all(`${destinationHost}/*`, async ({ request: interceptedRequest }) => {
        if (interceptedRequest.headers.get(proxiedThroughTalkback)) {
          interceptedRequest.headers.delete(proxiedThroughTalkback)
          return passthrough()
        }
        const parsedUrl = new URL(interceptedRequest.url)
        const parsedHost = `${parsedUrl.protocol}//${parsedUrl.hostname}`
        if (parsedHost !== destinationHost) {
          console.error("Request host doesn't match expected talkback host")
          return
        }
        let body = Buffer.alloc(0)
        if (interceptedRequest.body) {
          body = Buffer.from(await interceptedRequest.arrayBuffer())
        }

        const talkbackRequest = {
          body: body,
          headers: Object.fromEntries([
            [proxiedThroughTalkback, 'true'],
            ...headerEntries(interceptedRequest.headers),
          ]),
          method: interceptedRequest.method,
          url: interceptedRequest.url.slice(destinationHost.length),
        }

        return requestHandlers[handlerIndex]
          .handle(talkbackRequest)
          .then(
            ({ body: resBody, status, headers }) =>
              new HttpResponse(resBody, {
                headers,
                status,
              })
          )
          .catch((error) => {
            console.log('Error handling talkback request', error)
          })
      })
    )
  )
}

function headerEntries(
  headers: { entries: () => SpecIterableIterator<[string, string]> } | [string, string][]
): ([string, string] | [number, [string, string]])[] {
  if ('entries' in headers && typeof headers.entries === 'function') {
    return [...headers.entries()]
  }
  if (Array.isArray(headers)) {
    return [...headers]
  }
  return []
}
