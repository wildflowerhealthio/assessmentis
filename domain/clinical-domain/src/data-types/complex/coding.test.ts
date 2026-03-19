import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import * as Coding from './coding'

const codingArb = Arbitrary.make(Coding.Coding)

describe('Coding model', () => {
  test('Coding.DomainType is "Coding"', () => {
    expect(Coding.Coding.DomainType).toBe('Coding')
  })

  test('Coding.UrlSchema is defined', () => {
    expect(Coding.Coding.UrlSchema).toBeDefined()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codingArb, (coding) => {
        const encoded = Schema.encodeSync(Coding.Coding)(coding)
        const decoded = Schema.decodeSync(Coding.Coding)(encoded)
        expect(decoded).toSchemaEqual(coding)
      })
    )
  })
})
