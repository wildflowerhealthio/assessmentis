import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Observation } from './observation'

const observationArb = Arbitrary.make(Observation)

describe('Observation model', () => {
  test('Observation.DomainType is "Observation"', () => {
    expect(Observation.DomainType).toBe('Observation')
  })

  test('Observation.UrlSchema is defined', () => {
    expect(Observation.UrlSchema).toBeDefined()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(observationArb, (obs) => {
        const encoded = Schema.encodeSync(Observation)(obs)
        const decoded = Schema.decodeSync(Observation)(encoded)
        expect(decoded).toSchemaEqual(obs)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Observation must have domainType, status, and code
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            code: fc.record({ text: fc.string() }),
            domainType: fc.constant('Observation' as const),
          }),
          // Missing code
          fc.record({
            domainType: fc.constant('Observation' as const),
            status: fc.constantFrom('final', 'preliminary'),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      ),
      { numRuns: 20 }
    )
  })
})
