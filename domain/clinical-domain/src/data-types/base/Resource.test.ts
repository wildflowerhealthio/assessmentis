import { expect, test, describe } from 'vitest'
import { Resource } from './Resource'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Resource as FhirResource } from 'fhir/r4'

const TestResource = Resource(Schema.String)

// Compile-time check that Encoded schema matches FHIR R4
const _resourceEncoded: DeepReadonly<Omit<FhirResource, 'resourceType'>> =
  TestResource.Encoded

const resourceArb = Arbitrary.make(TestResource)

describe('Resource base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(resourceArb, (resource) => {
        const encoded = Schema.encodeSync(TestResource)(resource)
        const decoded = Schema.decodeSync(TestResource)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
