import talkback from 'talkback/es6'
import 'dotenv/config'
import { http, HttpHandler, HttpResponse, passthrough, SetupApi } from 'msw'
import { expect } from 'vitest'
import { setupServer, SetupServerApi } from 'msw/node'
import { SetupWorker, setupWorker } from 'msw/browser'

import RequestHandler from 'talkback/request-handler'

export const setupInterceptServer = async <TSetupApi>({
  mswSetup,
  tapePath,
  handlers,
  hosts,
}: {
  mswSetup: (...handlers: Array<HttpHandler>) => TSetupApi
  tapePath: string
  handlers: HttpHandler[]
  hosts: { host: string; name: string; urlSubstitutions?: [RegExp, string][] }[]
}): Promise<TSetupApi> => {
  const requestHandlers = await Promise.all(
    hosts.map(async ({ host, name, urlSubstitutions }) => {
      const requestHandler: RequestHandler = await talkback.requestHandler({
        name,
        host,
        path: tapePath,
        record:
          process.env.RECORD === 'true'
            ? talkback.Options.RecordMode.NEW
            : talkback.Options.RecordMode.DISABLED,
        debug: false,
        allowHeaders: [], // Don't use headers when matching tapes
        tapeNameGenerator(tapeNumber, tape) {
          const contentsName = [
            ...(urlSubstitutions ?? []),
            [/\//g, '__'] as const,
          ].reduce(
            (str, [pattern, replacement]) => str.replace(pattern, replacement),
            tape.req.url
          )

          let path = expect.getState().currentTestName?.split(' > ') ?? []
          const fileName = `${tape.req.method}__${contentsName}__${new Date(tapeNumber).toISOString()}`
          return [...path, name, fileName].join('/')
        },
      })
      return requestHandler
    })
  )

  const proxiedThroughTalkback = 'X-Proxied-Through-Talkback'

  return mswSetup(
    ...handlers,
    ...hosts.map(({ host }, handlerIndex) =>
      http.all(`${host}/*`, async ({ request: interceptedRequest }) => {
        if (interceptedRequest.headers.get(proxiedThroughTalkback)) {
          interceptedRequest.headers.delete(proxiedThroughTalkback)
          return passthrough()
        }
        const parsedUrl = new URL(interceptedRequest.url)
        const parsedHost = `${parsedUrl.protocol}//${parsedUrl.hostname}`
        if (parsedHost != host) {
          console.error("Request host doesn't match expected talkback host")
          return
        }
        let body = Buffer.alloc(0)
        if (interceptedRequest.body) {
          body = Buffer.from(await interceptedRequest.arrayBuffer())
        }

        const talkbackRequest = {
          url: interceptedRequest.url.substring(host.length),
          method: interceptedRequest.method,
          headers: Object.fromEntries([
            [proxiedThroughTalkback, 'true'],
            ...interceptedRequest.headers.entries(),
          ]),
          body: body,
        }

        return await requestHandlers[handlerIndex]
          .handle(talkbackRequest)
          .then(
            (r) =>
              new HttpResponse(r.body, {
                status: r.status,
                headers: r.headers,
              })
          )
          .catch((error) => {
            console.log('Error handling talkback request', error)
          })
      })
    )
  )
}
