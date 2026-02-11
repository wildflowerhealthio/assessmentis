import { expect, test, describe } from 'vitest'
import { Annotation } from './Annotation'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Annotation as FhirAnnotation } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _annotationEncoded: DeepReadonly<FhirAnnotation> = Annotation.Encoded

const annotationArb = Arbitrary.make(Annotation)

describe('Annotation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(annotationArb, (annotation) => {
        const encoded = Schema.encodeSync(Annotation)(annotation)
        const decoded = Schema.decodeSync(Annotation)(encoded)
        expect(decoded).toEqual(annotation)
      })
    )
  })
})
