import { expect, test, describe } from 'vitest'
import { Annotation } from './Annotation'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const annotationArb = Arbitrary.make(Annotation.Schema)

describe('Annotation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(annotationArb, (annotation) => {
        const encoded = Schema.encodeSync(Annotation.Schema)(annotation)
        const decoded = Schema.decodeSync(Annotation.Schema)(encoded)
        expect(decoded).toEqual(annotation)
      })
    )
  })
})
