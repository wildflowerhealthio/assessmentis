import { expect, test, describe } from 'vitest'
import type { Annotation } from './Annotation'
import { AnnotationFromFhirR4 } from './Annotation'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Annotation as FhirAnnotation } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _annotationEncoded: DeepReadonly<FhirAnnotation> = AnnotationFromFhirR4.Encoded

const annotationArb = Arbitrary.make(AnnotationFromFhirR4)

describe('Annotation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(annotationArb, (annotation) => {
        const encoded = Schema.encodeSync(AnnotationFromFhirR4)(annotation)
        const decoded = Schema.decodeSync(AnnotationFromFhirR4)(encoded)
        expect(decoded).toEqual(annotation)
      })
    )
  })
})
