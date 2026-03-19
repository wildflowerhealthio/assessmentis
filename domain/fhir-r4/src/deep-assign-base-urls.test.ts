import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Code, Quantity, Range } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { deepAssignBaseUrls } from './deep-assign-base-urls'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const otherUrl = ReadonlyUrl.make({
  host: 'unrelated.org',
  pathname: '/other',
  protocol: 'https:',
})

describe('deepAssignBaseUrls', () => {
  test('rewrites a top-level url to be under the base', () => {
    const quantity = Quantity.make({
      url: Quantity.UrlSchema.make(otherUrl),
      value: 42,
    })

    const fixed = deepAssignBaseUrls(quantity, baseUrl)

    expect(fixed.url).toBeDefined()
    expect(baseUrl.hasChild(fixed.url!)).toBe(true)
    expect(fixed.url!.pathname).toMatch(/\/Quantity\//)
  })

  test('leaves undefined urls as undefined', () => {
    const quantity = Quantity.make({ value: 7 })
    expect(quantity.url).toBeUndefined()

    const fixed = deepAssignBaseUrls(quantity, baseUrl)

    expect(fixed.url).toBeUndefined()
  })

  test('rewrites urls at every nesting level', () => {
    const range = Range.make({
      high: Quantity.make({
        value: 100,
        // no url — should stay undefined
      }),
      low: Quantity.make({
        url: Quantity.UrlSchema.make(otherUrl),
        value: 1,
      }),
      url: Range.UrlSchema.make(otherUrl),
    })

    const fixed = deepAssignBaseUrls(range, baseUrl)

    // Top-level Range url rewritten
    expect(fixed.url).toBeDefined()
    expect(baseUrl.hasChild(fixed.url!)).toBe(true)
    expect(fixed.url!.pathname).toMatch(/\/Range\//)

    // Nested low Quantity url rewritten
    expect(fixed.low).toBeDefined()
    expect(fixed.low!.url).toBeDefined()
    expect(baseUrl.hasChild(fixed.low!.url!)).toBe(true)
    expect(fixed.low!.url!.pathname).toMatch(/\/Quantity\//)

    // Nested high Quantity had no url — still undefined
    expect(fixed.high).toBeDefined()
    expect(fixed.high!.url).toBeUndefined()
  })

  test('each rewritten url gets a unique path segment', () => {
    const range = Range.make({
      high: Quantity.make({ url: Quantity.UrlSchema.make(otherUrl) }),
      low: Quantity.make({ url: Quantity.UrlSchema.make(otherUrl) }),
      url: Range.UrlSchema.make(otherUrl),
    })

    const fixed = deepAssignBaseUrls(range, baseUrl)

    const paths = [fixed.url!.pathname, fixed.low!.url!.pathname, fixed.high!.url!.pathname]
    // All unique
    expect(new Set(paths).size).toBe(3)
  })

  test('preserves non-url field values', () => {
    const quantity = Quantity.make({
      code: Code.make('kg'),
      system: 'http://unitsofmeasure.org',
      unit: 'kg',
      url: Quantity.UrlSchema.make(otherUrl),
      value: 99,
    })

    const fixed = deepAssignBaseUrls(quantity, baseUrl)

    expect(fixed.value).toBe(99)
    expect(fixed.unit).toBe('kg')
    expect(fixed.system).toBe('http://unitsofmeasure.org')
    expect(fixed.code).toBe('kg')
  })

  test('preserves class prototype (instanceof still works)', () => {
    const quantity = Quantity.make({
      url: Quantity.UrlSchema.make(otherUrl),
      value: 1,
    })

    const fixed = deepAssignBaseUrls(quantity, baseUrl)

    expect(fixed).toBeInstanceOf(Quantity)
  })

  test('property: all defined urls in an arbitrary Range share the base prefix', () => {
    const collectUrls = (v: unknown): readonly ReadonlyUrl[] => {
      if (v === null || v === undefined || typeof v !== 'object') {
        return []
      }
      if (v instanceof ReadonlyUrl) {
        return []
      }
      if (Array.isArray(v)) {
        return v.flatMap((item) => collectUrls(item))
      }
      const urls: ReadonlyUrl[] = []
      for (const [key, val] of Object.entries(v)) {
        if (key === 'url' && val instanceof ReadonlyUrl) {
          urls.push(val)
        } else {
          urls.push(...collectUrls(val))
        }
      }
      return urls
    }

    fc.assert(
      fc.property(Arbitrary.make(Range), (range) => {
        const fixed = deepAssignBaseUrls(range, baseUrl)
        const urls = collectUrls(fixed)

        for (const url of urls) {
          expect(baseUrl.hasChild(url)).toBe(true)
        }
      })
    )
  })
})
