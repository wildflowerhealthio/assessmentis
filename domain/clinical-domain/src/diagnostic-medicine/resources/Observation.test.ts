import { expect, test, describe } from 'vitest'
import { Observation } from './Observation'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

const observationArb = Arbitrary.make(Observation.Schema)

describe('Observation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(observationArb, (obs) => {
        const encoded = Schema.encodeSync(Observation.Schema)(obs)
        const decoded = Schema.decodeSync(Observation.Schema)(encoded)
        expect(decoded).toEqual(obs)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Observation must have resourceType, status, and code
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            resourceType: fc.constant('Observation' as const),
            code: fc.record({ text: fc.string() }),
          }),
          // Missing code
          fc.record({
            resourceType: fc.constant('Observation' as const),
            status: fc.constantFrom('final', 'preliminary'),
          }),
          // Missing resourceType
          fc.record({
            status: fc.constantFrom('final', 'preliminary'),
            code: fc.record({ text: fc.string() }),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Observation.Schema)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
