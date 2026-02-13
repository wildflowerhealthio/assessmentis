import { expect, test, describe } from 'vitest'
import { QuestionnaireResponseItemAnswerFromFhirR4 } from './QuestionnaireResponseItem.js'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { QuestionnaireResponseItemAnswer as FhirQuestionnaireResponseItemAnswer } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4 type
const _qrItemAnswerEncoded: DeepReadonly<FhirQuestionnaireResponseItemAnswer> =
  QuestionnaireResponseItemAnswerFromFhirR4.Encoded

const answerArb = Arbitrary.make(QuestionnaireResponseItemAnswerFromFhirR4)

describe('QuestionnaireResponseItemAnswer', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(answerArb, (answer) => {
        const encoded = Schema.encodeSync(
          QuestionnaireResponseItemAnswerFromFhirR4
        )(answer)
        const decoded = Schema.decodeSync(
          QuestionnaireResponseItemAnswerFromFhirR4
        )(encoded)
        expect(decoded).toEqual(answer)
      })
    )
  })
})
