import { expect, test, describe, expectTypeOf } from 'vitest'
import { Annotation } from './Annotation'
import type { AnnotationEncoded } from './Annotation'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

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
