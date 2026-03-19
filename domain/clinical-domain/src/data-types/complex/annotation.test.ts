import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Annotation } from './annotation'
import type { AnnotationEncoded } from './annotation'

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
        expect(decoded).toSchemaEqual(annotation)
      })
    )
  })
})
