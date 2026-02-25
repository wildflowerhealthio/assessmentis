import { expect, test, describe } from 'vitest'
import { QuestionnaireResponse } from './QuestionnaireResponse'
import { Arbitrary, Schema, DateTime } from 'effect'
import * as fc from 'fast-check'

const questionnaireResponseArb = Arbitrary.make(QuestionnaireResponse)

describe('QuestionnaireResponse resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, (response) => {
        const encoded = Schema.encodeSync(QuestionnaireResponse)(response)
        const decoded = Schema.decodeSync(QuestionnaireResponse)(encoded)
        expect(decoded).toEqual(response)
      }),
      { numRuns: 50 }
    )
  })

  test('property: QuestionnaireResponse.firstItemAnsweredAfter returns undefined for empty items', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, fc.date(), (response, date) => {
        const emptyResponse = QuestionnaireResponse.make({
          ...response,
          item: [],
        })
        const result = emptyResponse.firstItemAnsweredAfter(
          DateTime.unsafeMake(date)
        )
        expect(result).toBeUndefined()
      })
    )
  })
})
