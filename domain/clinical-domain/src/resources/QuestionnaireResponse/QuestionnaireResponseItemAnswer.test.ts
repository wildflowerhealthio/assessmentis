import { expect, test, describe } from 'vitest'
import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

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
