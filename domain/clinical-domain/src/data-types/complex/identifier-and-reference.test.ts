import { Arbitrary, Effect, Exit, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { ExternalAssertionError } from '@assessmentis/ontology'

import { Identifier, Reference } from './identifier-and-reference'
import type { IdentifierEncoded, ReferenceEncoded } from './identifier-and-reference'

/**
 * A minimal resource-like object matching the shape expected by
 * `asResourceUrl` and `fromResource`.
 */
const TestUrlSchema = Schema.String.pipe(
  Schema.compose(ReadonlyUrl.FromString),
  Schema.brand('TestResource/url')
)
const TestResource = {
  DomainType: 'TestResource' as const,
  UrlSchema: TestUrlSchema,
}

const referenceArb = Arbitrary.make(Reference)

describe('Reference model', () => {
  test('Reference.DomainType is "Reference"', () => {
    expect(Reference.DomainType).toBe('Reference')
  })

  test('should encode to encoded type', () => {
    expectTypeOf<typeof Reference.Encoded>().toExtend<ReferenceEncoded>()
  })
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(Reference)(reference)
        const decoded = Schema.decodeSync(Reference)(encoded)
        expect(decoded).toSchemaEqual(reference)
      })
    )
  })

  describe('asResourceUrl', () => {
    test('succeeds when type matches and reference is a valid URL', () => {
      const ref = new Reference({
        reference: 'https://example.com/TestResource/123',
        type: 'TestResource',
      })
      const result = Effect.runSyncExit(ref.asResourceUrl(TestResource))
      expect(Exit.isSuccess(result)).toBe(true)
    })

    test('fails with ExternalAssertionError when type does not match', () => {
      const ref = new Reference({
        reference: 'https://example.com/WrongType/123',
        type: 'WrongType',
      })
      const result = Effect.runSyncExit(ref.asResourceUrl(TestResource))
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = result.cause.pipe((c) => {
          if (c._tag === 'Fail') {
            return c.error
          }
          return undefined
        })
        expect(error).toBeInstanceOf(ExternalAssertionError)
      }
    })

    test('fails with ExternalAssertionError when type is undefined', () => {
      const ref = new Reference({
        reference: 'https://example.com/TestResource/123',
      })
      const result = Effect.runSyncExit(ref.asResourceUrl(TestResource))
      expect(Exit.isFailure(result)).toBe(true)
    })

    test('fails with ExternalAssertionError when reference is undefined', () => {
      const ref = new Reference({
        type: 'TestResource',
      })
      const result = Effect.runSyncExit(ref.asResourceUrl(TestResource))
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = result.cause.pipe((c) => {
          if (c._tag === 'Fail') {
            return c.error
          }
          return undefined
        })
        expect(error).toBeInstanceOf(ExternalAssertionError)
      }
    })
  })

  describe('fromResource', () => {
    test('returns a Reference when url is present', () => {
      const url = Schema.decodeSync(ReadonlyUrl.FromString)('https://example.com/TestResource/456')
      const result = Reference.fromResource({
        domainType: 'TestResource',
        url,
      })
      expect(result).toBeInstanceOf(Reference)
      expect(result?.type).toBe('TestResource')
      expect(result?.reference).toBe('https://example.com/TestResource/456')
    })

    test('returns a Reference with display when provided', () => {
      const url = Schema.decodeSync(ReadonlyUrl.FromString)('https://example.com/TestResource/456')
      const result = Reference.fromResource({ domainType: 'TestResource', url }, 'Test Display')
      expect(result).toBeInstanceOf(Reference)
      expect(result?.display).toBe('Test Display')
    })

    test('returns undefined when url is undefined', () => {
      const result = Reference.fromResource({
        domainType: 'TestResource',
        url: undefined,
      })
      expect(result).toBeUndefined()
    })
  })
})

const identifierArb = Arbitrary.make(Identifier)

describe('Identifier model', () => {
  test('Identifier.DomainType is "Identifier"', () => {
    expect(Identifier.DomainType).toBe('Identifier')
  })

  test('should encode to encoded type', () => {
    expectTypeOf<typeof Identifier.Encoded>().toExtend<IdentifierEncoded>()
  })
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(identifierArb, (identifier) => {
        const encoded = Schema.encodeSync(Identifier)(identifier)
        const decoded = Schema.decodeSync(Identifier)(encoded)
        expect(decoded).toSchemaEqual(identifier)
      })
    )
  })
})
