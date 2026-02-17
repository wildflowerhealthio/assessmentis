import { expect, test, describe } from 'vitest'
import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const answerArb = Arbitrary.make(QuestionnaireResponseItemAnswer.Schema)

describe('QuestionnaireResponseItemAnswer', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(answerArb, (answer) => {
        const encoded = Schema.encodeSync(
          QuestionnaireResponseItemAnswer.Schema
        )(answer)
        const decoded = Schema.decodeSync(
          QuestionnaireResponseItemAnswer.Schema
        )(encoded)
        expect(decoded).toEqual(answer)
      })
    )
  })
})
