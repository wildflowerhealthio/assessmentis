import { describe, it, expect, expectTypeOf } from 'vitest'
import { Effect, pipe, Schema } from 'effect'
import { extendObjectSchemas } from './extendObjectSchemas'

describe('extendObjectSchemas', () => {
  describe('two plain structs', () => {
    const ab = extendObjectSchemas(
      Schema.Struct({ name: Schema.String }),
      Schema.Struct({ age: Schema.Number })
    )

    it('decodes', () => {
      const result = Schema.decodeUnknownSync(ab)({ name: 'Alice', age: 30 })
      expect(result).toEqual({ name: 'Alice', age: 30 })
    })

    it('encodes', () => {
      const result = Schema.encodeUnknownSync(ab)({ name: 'Alice', age: 30 })
      expect(result).toEqual({ name: 'Alice', age: 30 })
    })
  })

  describe('transformOrFail + struct with fromKey', () => {
    // Simulates the ElementIdentification pattern: {id} → {url}
    const identification = Schema.transformOrFail(
      Schema.Struct({ id: Schema.optional(Schema.String) }),
      Schema.Struct({ url: Schema.optional(Schema.String) }),
      {
        strict: true,
        decode: (input) =>
          Effect.succeed({
            url: input.id ? `http://example.com/${input.id}` : undefined,
          }),
        encode: (input) => Effect.succeed({ id: input.url?.split('/').pop() }),
      }
    )

    // Simulates the Extension pattern: FHIR 'url' → domain 'definitionUrl'
    const fieldsWithFromKey = Schema.Struct({
      definitionUrl: pipe(
        Schema.String,
        Schema.propertySignature,
        Schema.fromKey('url')
      ),
      value: Schema.optional(Schema.String),
    })

    // This is the combination that Schema.extend cannot handle
    const combined = extendObjectSchemas(identification, fieldsWithFromKey)

    it('decodes, running both transforms', () => {
      const result = Schema.decodeUnknownSync(combined)({
        id: '123',
        url: 'http://hl7.org/fhir/extension',
        value: 'hello',
      })
      expect(result).toEqual({
        url: 'http://example.com/123',
        definitionUrl: 'http://hl7.org/fhir/extension',
        value: 'hello',
      })
    })

    it('encodes, reversing both transforms', () => {
      const result = Schema.encodeUnknownSync(combined)({
        url: 'http://example.com/123',
        definitionUrl: 'http://hl7.org/fhir/extension',
        value: 'hello',
      })
      expect(result).toEqual({
        id: '123',
        url: 'http://hl7.org/fhir/extension',
        value: 'hello',
      })
    })

    it('round-trips', () => {
      const input = {
        id: '456',
        url: 'http://hl7.org/fhir/some-ext',
        value: 'world',
      }
      const decoded = Schema.decodeUnknownSync(combined)(input)
      const reEncoded = Schema.encodeUnknownSync(combined)(decoded)
      expect(reEncoded).toEqual(input)
    })
  })

  describe('type-level key collision detection', () => {
    it('prevents type-level key overlap (also throws at runtime)', () => {
      const a = Schema.Struct({ name: Schema.String })
      const b = Schema.Struct({ name: Schema.Number })
      expect(() => extendObjectSchemas(a, b)).toThrow(/overlapping/)
    })

    it('prevents encoded-level key overlap', () => {
      const a = Schema.Struct({ name: Schema.String })
      const b = Schema.Struct({
        label: pipe(
          Schema.String,
          Schema.propertySignature,
          Schema.fromKey('name')
        ),
      })
      // Schema.extend merges compatible encoded types at runtime without error,
      // but extendObjectSchemas catches the collision at the type level
      const result = extendObjectSchemas(a, b)
      expectTypeOf(result).toBeString()
    })
  })
})
