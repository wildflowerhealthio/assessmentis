import { expect, test, describe } from 'vitest'
import { Questionnaire } from './Questionnaire'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Questionnaire as FhirQuestionnaire } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _questionnaireEncoded: DeepReadonly<FhirQuestionnaire> =
  Questionnaire.Encoded

const questionnaireArb = Arbitrary.make(Questionnaire)

describe('Questionnaire resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireArb, (questionnaire) => {
        const encoded = Schema.encodeSync(Questionnaire)(questionnaire)
        const decoded = Schema.decodeSync(Questionnaire)(encoded)
        expect(decoded).toEqual(questionnaire)
      })
    )
  })
})
