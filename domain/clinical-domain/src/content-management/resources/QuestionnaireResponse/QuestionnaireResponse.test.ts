import { expect, test, describe } from 'vitest'
import {
  QuestionnaireResponse,
  firstItemAnsweredAfter,
} from './QuestionnaireResponse'
import { Arbitrary, Schema, DateTime } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { QuestionnaireResponse as FhirQuestionnaireResponse } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _questionnaireResponseEncoded: DeepReadonly<FhirQuestionnaireResponse> =
  QuestionnaireResponse.Encoded

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

  test('property: firstItemAnsweredAfter returns undefined for empty items', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, fc.date(), (response, date) => {
        const emptyResponse = { ...response, item: [] }
        const result = firstItemAnsweredAfter(
          emptyResponse,
          DateTime.unsafeMake(date)
        )
        expect(result).toBeUndefined()
      })
    )
  })
})
