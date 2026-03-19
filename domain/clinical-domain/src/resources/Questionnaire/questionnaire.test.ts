import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import * as Questionnaire from './questionnaire'

const questionnaireArb = Arbitrary.make(Questionnaire.Questionnaire)

describe('Questionnaire resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireArb, (questionnaire) => {
        const encoded = Schema.encodeSync(Questionnaire.Questionnaire)(questionnaire)
        const decoded = Schema.decodeSync(Questionnaire.Questionnaire)(encoded)
        expect(decoded).toSchemaEqual(questionnaire)
      })
    )
  })
})
