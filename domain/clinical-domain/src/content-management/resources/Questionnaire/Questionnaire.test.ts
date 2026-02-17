import { expect, test, describe } from 'vitest'
import { Questionnaire } from './Questionnaire'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const questionnaireArb = Arbitrary.make(Questionnaire.Schema)

describe('Questionnaire resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireArb, (questionnaire) => {
        const encoded = Schema.encodeSync(Questionnaire.Schema)(
          questionnaire
        )
        const decoded = Schema.decodeSync(Questionnaire.Schema)(encoded)
        expect(decoded).toEqual(questionnaire)
      })
    )
  })
})
