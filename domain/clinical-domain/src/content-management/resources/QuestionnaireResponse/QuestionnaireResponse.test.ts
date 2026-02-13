import { expect, test, describe } from 'vitest'
import {
  QuestionnaireResponseFromFhirR4,
  firstItemAnsweredAfter,
} from './QuestionnaireResponse'
import { Arbitrary, Schema, DateTime } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { QuestionnaireResponse as FhirQuestionnaireResponse } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _questionnaireResponseEncoded: DeepReadonly<FhirQuestionnaireResponse> =
  QuestionnaireResponseFromFhirR4.Encoded

const questionnaireResponseArb = Arbitrary.make(QuestionnaireResponseFromFhirR4)

describe('QuestionnaireResponse resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(questionnaireResponseArb, (response) => {
        const encoded = Schema.encodeSync(QuestionnaireResponseFromFhirR4)(
          response
        )
        const decoded = Schema.decodeSync(QuestionnaireResponseFromFhirR4)(
          encoded
        )
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
