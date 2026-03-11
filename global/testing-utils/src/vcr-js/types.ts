import { expect } from 'vitest'

import type { HttpHandler } from 'msw'
import talkback from 'talkback/es6'
import type { Options } from 'talkback/options'

/** Configuration for a single external host whose HTTP traffic will be recorded/replayed. */
export interface VcrHost {
  readonly name: string
  readonly destinationHost: string
  readonly urlSubstitutions?: [RegExp, string][]
  readonly proxyPort?: number
  readonly proxyHost?: string
}

/** A {@link VcrHost} with required proxy port/host for server-side recording. */
export interface VcrServerHost extends VcrHost {
  readonly proxyPort: number
  readonly proxyHost: string
}

/** Options for configuring VCR (HTTP record/replay) in browser or node tests. */
export interface VcrOpts {
  silent?: boolean
  summary?: boolean
  debug?: boolean
  tapePath: string
  handlers: HttpHandler[]
  hosts: VcrHost[]
}

/** {@link VcrOpts} specialized for Node.js server-side recording with required proxy hosts. */
export interface VcrServerOpts extends VcrOpts {
  hosts: VcrServerHost[]
}

/** Returns true when the `RECORD` or `VITE_RECORD` env var is `"true"`, indicating tapes should be written. */
export const shouldRecord = () =>
  import.meta.env.RECORD === 'true' || import.meta.env.VITE_RECORD === 'true'

/**
 * Converts {@link VcrOpts} into an array of Talkback `Options` — one per
 * host. Handles tape naming (based on the current Vitest test name),
 * record mode, and URL substitutions.
 */
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
