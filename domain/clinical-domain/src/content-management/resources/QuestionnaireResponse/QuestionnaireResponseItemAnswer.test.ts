import { expect, test, describe } from 'vitest'
import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { QuestionnaireResponseItemAnswer as FhirQuestionnaireResponseItemAnswer } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4 type
const _qrItemAnswerEncoded: DeepReadonly<FhirQuestionnaireResponseItemAnswer> =
  QuestionnaireResponseItemAnswer.Encoded

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
