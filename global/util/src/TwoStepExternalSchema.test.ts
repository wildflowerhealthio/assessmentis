import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import { TwoStepExternalSchema } from './TwoStepExternalSchema'

// --- Test schemas ---

// A simple "domain" type
class DomainPerson extends Schema.Class<DomainPerson>('DomainPerson')({
  fullName: Schema.String,
  age: Schema.Number,
}) {}

// An "encoded" intermediate representation (domain-encoded)
const DomainPersonEncoded = Schema.Struct({
  fullName: Schema.String,
  age: Schema.Number,
})

// The "external" representation (e.g., FHIR JSON)
const ExternalPersonEncoded = Schema.Struct({
  name: Schema.String,
  yearsOld: Schema.Number,
})

// Transform: External → DomainEncoded
const ExternalToEncoded = Schema.transform(
  ExternalPersonEncoded,
  DomainPersonEncoded,
  {
    strict: true,
    decode: (external) => ({
      fullName: external.name,
      age: external.yearsOld,
    }),
    encode: (encoded) => ({
      name: encoded.fullName,
      yearsOld: encoded.age,
    }),
  }
)

// Transform: DomainEncoded → Domain
const EncodedToDomain = Schema.transform(DomainPersonEncoded, DomainPerson, {
  strict: true,
  decode: (encoded) => new DomainPerson(encoded),
  encode: (domain) => ({
    fullName: domain.fullName,
    age: domain.age,
  }),
})

describe('TwoStepExternalSchema', () => {
  const twoStep = new TwoStepExternalSchema(EncodedToDomain, ExternalToEncoded)

  it('decodes from external to domain type', () => {
    const decoded = Schema.decodeUnknownSync(twoStep)({
      name: 'Alice',
      yearsOld: 30,
    })

    expect(decoded).toBeInstanceOf(DomainPerson)
    expect(decoded.fullName).toBe('Alice')
    expect(decoded.age).toBe(30)
  })

  it('encodes from domain to external type', () => {
    const encoded = Schema.encodeSync(twoStep)(
      new DomainPerson({ fullName: 'Bob', age: 25 })
    )

    expect(encoded).toEqual({ name: 'Bob', yearsOld: 25 })
  })

  it('exposes EncodedFromExternal schema', () => {
    const decoded = Schema.decodeUnknownSync(twoStep.EncodedFromExternal)({
      name: 'Charlie',
      yearsOld: 40,
    })

    expect(decoded).toEqual({ fullName: 'Charlie', age: 40 })
  })

  it('has a valid ast property', () => {
    expect(twoStep.ast).toBeDefined()
  })

  it('supports annotations', () => {
    const annotated = twoStep.annotations({ identifier: 'TestPerson' })
    expect(annotated).toBeDefined()
    // Should still decode correctly
    const decoded = Schema.decodeUnknownSync(annotated)({
      name: 'Dave',
      yearsOld: 35,
    })
    expect(decoded).toBeInstanceOf(DomainPerson)
  })

  it('is assignable to Schema.Schema', () => {
    // Type-level test: this should compile
    const schema: Schema.Schema<
      DomainPerson,
      typeof ExternalPersonEncoded.Type
    > = twoStep
    expect(schema).toBe(twoStep)
  })
})
