import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import * as Composition from './composition'

const compositionArb = Arbitrary.make(Composition.Composition)

describe('Composition', () => {
  it('Composition.DomainType is "Composition"', () => {
    expect(Composition.Composition.DomainType).toBe('Composition')
  })

  it('Composition.UrlSchema is defined', () => {
    expect(Composition.Composition.UrlSchema).toBeDefined()
  })

  it('should encode and decode', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const encoded = Schema.encodeSync(Composition.Composition)(comp)
        const decoded = Schema.decodeSync(Composition.Composition)(encoded)
        expect(decoded).toSchemaEqual(comp)
      }),
      { numRuns: 10 }
    )
  })
})
