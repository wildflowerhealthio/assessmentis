import talkback from 'talkback/es6'
import type { Options } from 'talkback/options'
import type { HttpHandler } from 'msw'
import { expect } from 'vitest'

export interface VcrHost {
  readonly name: string
  readonly destinationHost: string
  readonly urlSubstitutions?: [RegExp, string][]
  readonly proxyPort?: number
  readonly proxyHost?: string
}

export interface VcrServerHost extends VcrHost {
  readonly proxyPort: number
  readonly proxyHost: string
}

export interface VcrOpts {
  silent?: boolean
  summary?: boolean
  debug?: boolean
  tapePath: string
  handlers: HttpHandler[]
  hosts: VcrHost[]
}

export interface VcrServerOpts extends VcrOpts {
  hosts: VcrServerHost[]
}

export const shouldRecord = () =>
  import.meta.env.RECORD === 'true' || import.meta.env.VITE_RECORD === 'true'

export const vcrOptsTalkbackOptions = (
  opts: VcrOpts | VcrServerOpts
): Partial<Options>[] =>
  opts.hosts.map(({ destinationHost, name, urlSubstitutions, proxyPort }) => ({
    name,
    host: destinationHost,
    path: opts.tapePath,
    port: proxyPort,
    record: shouldRecord()
      ? talkback.Options.RecordMode.NEW
      : talkback.Options.RecordMode.DISABLED,
    silent: opts.silent ?? true,
    summary: opts.summary ?? false,
    debug: opts.debug ?? false,
    allowHeaders: [], // Don't use headers when matching tapes
    tapeNameGenerator(tapeNumber, tape) {
      const contentsName = [
        ...(urlSubstitutions ?? []),
        [/\//g, '__'] as const,
      ].reduce(
        (str, [pattern, replacement]) => str.replace(pattern, replacement),
        tape.req.url
      )

      const path = expect.getState().currentTestName?.split(' > ') ?? []
      const fileName = `${tape.req.method}__${contentsName}__${new Date(tapeNumber).toISOString()}`
      return [...path, name, fileName].join('/')
    },
  }))
