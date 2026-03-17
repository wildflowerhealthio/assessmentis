import { describe, expect, it } from 'vitest'
import { Schema } from 'effect'

import {
  ThreeStepExternalSchema,
  TwoStepExternalSchema,
} from './TwoStepExternalSchema'

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

// --- Three-step test schemas ---

// An "integration" type — the decoded form of the raw integration payload
const IntegrationPerson = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  birthYear: Schema.Number,
})

// The raw integration-encoded payload (e.g. wire format)
const IntegrationPersonEncoded = Schema.Struct({
  given_name: Schema.String,
  family_name: Schema.String,
  birth_year: Schema.Number,
})

// Step 1: IntegrationEncoded → IntegrationType
const IntegrationFromEncoded = Schema.transform(
  IntegrationPersonEncoded,
  IntegrationPerson,
  {
    strict: true,
    decode: (raw) => ({
      givenName: raw.given_name,
      familyName: raw.family_name,
      birthYear: raw.birth_year,
    }),
    encode: (decoded) => ({
      given_name: decoded.givenName,
      family_name: decoded.familyName,
      birth_year: decoded.birthYear,
    }),
  }
)

// Step 2: IntegrationType → DomainEncoded
const DomainEncodedFromIntegration = Schema.transform(
  IntegrationPerson,
  DomainPersonEncoded,
  {
    strict: true,
    decode: (integration) => ({
      fullName: `${integration.givenName} ${integration.familyName}`,
      age: new Date().getFullYear() - integration.birthYear,
    }),
    encode: (encoded) => ({
      givenName: encoded.fullName.split(' ')[0] ?? '',
      familyName: encoded.fullName.split(' ').slice(1).join(' '),
      birthYear: new Date().getFullYear() - encoded.age,
    }),
  }
)

// Step 3: DomainEncoded → Domain (reuses EncodedToDomain from above)

describe('ThreeStepExternalSchema', () => {
  const threeStep = new ThreeStepExternalSchema(
    EncodedToDomain,
    IntegrationFromEncoded,
    DomainEncodedFromIntegration
  )

  it('decodes from integration-encoded to domain type', () => {
    const decoded = Schema.decodeUnknownSync(threeStep)({
      given_name: 'Alice',
      family_name: 'Smith',
      birth_year: 1996,
    })

    expect(decoded).toBeInstanceOf(DomainPerson)
    expect(decoded.fullName).toBe('Alice Smith')
    expect(decoded.age).toBe(new Date().getFullYear() - 1996)
  })

  it('encodes from domain to integration-encoded type', () => {
    const age = 30
    const encoded = Schema.encodeSync(threeStep)(
      new DomainPerson({ fullName: 'Bob Jones', age })
    )

    expect(encoded).toEqual({
      given_name: 'Bob',
      family_name: 'Jones',
      birth_year: new Date().getFullYear() - age,
    })
  })

  it('round-trips decode then encode', () => {
    const input = {
      given_name: 'Charlie',
      family_name: 'Brown',
      birth_year: 2000,
    }

    const decoded = Schema.decodeUnknownSync(threeStep)(input)
    const encoded = Schema.encodeSync(threeStep)(decoded)

    expect(encoded).toEqual(input)
  })

  it('exposes DomainEncodedFromExternalType schema', () => {
    const decoded = Schema.decodeUnknownSync(
      threeStep.DomainEncodedFromExternalType
    )({
      givenName: 'Dave',
      familyName: 'White',
      birthYear: 1990,
    })

    expect(decoded).toEqual({
      fullName: 'Dave White',
      age: new Date().getFullYear() - 1990,
    })
  })

  it('has a valid ast property', () => {
    expect(threeStep.ast).toBeDefined()
  })

  it('supports annotations', () => {
    const annotated = threeStep.annotations({ identifier: 'TestThreeStep' })
    expect(annotated).toBeDefined()
    const decoded = Schema.decodeUnknownSync(annotated)({
      given_name: 'Eve',
      family_name: 'Green',
      birth_year: 1985,
    })
    expect(decoded).toBeInstanceOf(DomainPerson)
  })

  it('is assignable to Schema.Schema', () => {
    const schema: Schema.Schema<
      DomainPerson,
      typeof IntegrationPersonEncoded.Type
    > = threeStep
    expect(schema).toBe(threeStep)
  })
})
