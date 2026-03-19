import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { BackboneElement } from '../../data-types/base/backbone-element'
import { QuestionnaireItemAnsweredAtExtension } from './questionnaire-item-answered-at'

const TestBackboneElement = BackboneElement('Test')
const backboneElementArb = Arbitrary.make(TestBackboneElement)
const dateTimeArb = Arbitrary.make(Schema.DateTimeUtc)

describe('QuestionnaireItemAnsweredAt extension', () => {
  test('property: get(with(x)) is identity', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = QuestionnaireItemAnsweredAtExtension.withValue(element, date)
        const retrieved = QuestionnaireItemAnsweredAtExtension.get(withDate)
        expect(retrieved).toEqual(date)
      })
    )
  })

  test('property: with(undefined) removes extension', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = QuestionnaireItemAnsweredAtExtension.withValue(element, date)
        // eslint-disable-next-line unicorn/no-useless-undefined -- testing removal by passing undefined
        const removed = QuestionnaireItemAnsweredAtExtension.withValue(withDate, undefined)
        const retrieved = QuestionnaireItemAnsweredAtExtension.get(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
