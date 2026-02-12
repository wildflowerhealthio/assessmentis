import { expect, test, describe } from 'vitest'
import { DomainResource } from './DomainResource'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { DomainResource as FhirDomainResource } from 'fhir/r4'

const TestDomainResource = Schema.Struct({
  ...DomainResource(Schema.String).fields,
  resourceType: Schema.Literal('Basic'),
})

// Compile-time check that Encoded schema matches FHIR R4
const _domainResourceEncoded: DeepReadonly<FhirDomainResource> =
  TestDomainResource.Encoded

const domainResourceArb = Arbitrary.make(TestDomainResource)

describe('DomainResource base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(domainResourceArb, (resource) => {
        const encoded = Schema.encodeSync(TestDomainResource)(resource)
        const decoded = Schema.decodeSync(TestDomainResource)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
