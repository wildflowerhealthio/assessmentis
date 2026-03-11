import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'

const answerArb = Arbitrary.make(QuestionnaireResponseItemAnswer)

describe('QuestionnaireResponseItemAnswer', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(answerArb, (answer) => {
        const encoded = Schema.encodeSync(QuestionnaireResponseItemAnswer)(
          answer
        )
        const decoded = Schema.decodeSync(QuestionnaireResponseItemAnswer)(
          encoded
        )
        expect(decoded).toEqual(answer)
      })
    )
  })
})
