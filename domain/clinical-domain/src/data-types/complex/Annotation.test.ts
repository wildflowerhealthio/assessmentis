import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { Annotation, type AnnotationEncoded } from './Annotation'

const annotationArb = Arbitrary.make(Annotation)

describe('Annotation model', () => {
  test('types', () => {
    expectTypeOf<typeof Annotation.Encoded>().toExtend<AnnotationEncoded>()
  })
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
