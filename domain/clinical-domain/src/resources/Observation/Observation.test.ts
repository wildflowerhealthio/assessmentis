import { expect, test, describe } from 'vitest'
import { Observation } from './Observation'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

const observationArb = Arbitrary.make(Observation)

describe('Observation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(observationArb, (obs) => {
        const encoded = Schema.encodeSync(Observation)(obs)
        const decoded = Schema.decodeSync(Observation)(encoded)
        expect(decoded).toEqual(obs)
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
            domainType: fc.constant('Observation' as const),
            code: fc.record({ text: fc.string() }),
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
