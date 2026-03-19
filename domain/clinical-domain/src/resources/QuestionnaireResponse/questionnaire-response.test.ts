import { Arbitrary, DateTime, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { QuestionnaireResponse } from './questionnaire-response'

const questionnaireResponseArb = Arbitrary.make(QuestionnaireResponse)

describe('QuestionnaireResponse resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, (response) => {
        const encoded = Schema.encodeSync(QuestionnaireResponse)(response)
        const decoded = Schema.decodeSync(QuestionnaireResponse)(encoded)
        expect(decoded).toSchemaEqual(response)
      }),
      { numRuns: 50 }
    )
  })

  test('property: QuestionnaireResponse.firstItemAnsweredAfter returns undefined for empty items', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, fc.date(), (response, date) => {
        const emptyResponse = response.cloneWith({
          item: [],
        })
        const result = emptyResponse.firstItemAnsweredAfter(DateTime.unsafeMake(date))
        expect(result).toBeNull()
      })
    )
  })
})
