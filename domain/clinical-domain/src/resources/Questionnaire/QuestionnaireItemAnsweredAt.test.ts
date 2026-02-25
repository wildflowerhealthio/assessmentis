import { expect, test, describe } from 'vitest'
import { QuestionnaireItemAnsweredAtExtension } from './QuestionnaireItemAnsweredAt'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { BackboneElement } from '../../data-types/base/BackboneElement'

const TestBackboneElement = BackboneElement('Test')
const backboneElementArb = Arbitrary.make(TestBackboneElement)
const dateTimeArb = Arbitrary.make(Schema.DateTimeUtc)

describe('QuestionnaireItemAnsweredAt extension', () => {
  test('property: get(with(x)) is identity', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = QuestionnaireItemAnsweredAtExtension.with(
          element,
          date
        )
        const retrieved = QuestionnaireItemAnsweredAtExtension.get(withDate)
        expect(retrieved).toEqual(date)
      })
    )
  })

  test('property: with(undefined) removes extension', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = QuestionnaireItemAnsweredAtExtension.with(
          element,
          date
        )
        const removed = QuestionnaireItemAnsweredAtExtension.with(
          withDate,
          undefined
        )
        const retrieved = QuestionnaireItemAnsweredAtExtension.get(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
