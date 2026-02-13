import { expect, test, describe } from 'vitest'
import { QuestionnaireFromFhirR4 } from './Questionnaire'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Questionnaire as FhirQuestionnaire } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _questionnaireEncoded: DeepReadonly<FhirQuestionnaire> =
  QuestionnaireFromFhirR4.Encoded

const questionnaireArb = Arbitrary.make(QuestionnaireFromFhirR4)

describe('Questionnaire resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireArb, (questionnaire) => {
        const encoded = Schema.encodeSync(QuestionnaireFromFhirR4)(
          questionnaire
        )
        const decoded = Schema.decodeSync(QuestionnaireFromFhirR4)(encoded)
        expect(decoded).toEqual(questionnaire)
      })
    )
  })
})
