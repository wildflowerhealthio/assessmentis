import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import * as Practitioner from './practitioner'

const practitionerArb = Arbitrary.make(Practitioner.Practitioner)

describe('Practitioner model', () => {
  test('Practitioner.DomainType is "Practitioner"', () => {
    expect(Practitioner.Practitioner.DomainType).toBe('Practitioner')
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(practitionerArb, (practitioner) => {
        const encoded = Schema.encodeSync(Practitioner.Practitioner)(practitioner)
        const decoded = Schema.decodeSync(Practitioner.Practitioner)(encoded)
        expect(decoded).toSchemaEqual(practitioner)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Practitioner must have domainType
    fc.assert(
      fc.property(
        fc.oneof(
          // Wrong domainType
          fc.record({
            domainType: fc.constant('Patient' as const),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Practitioner.Practitioner)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
