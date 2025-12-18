import { expect, test, describe } from 'vitest'
import { getAnsweredAt, withAnsweredAt } from './QuestionnaireItemAnsweredAt'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { BackboneElement } from '../../data-types/base/BackboneElement'

const TestBackboneElement = BackboneElement(Schema.String)
const backboneElementArb = Arbitrary.make(TestBackboneElement)
const dateTimeArb = Arbitrary.make(Schema.DateTimeUtc)

describe('QuestionnaireItemAnsweredAt extension', () => {
  test('property: get(with(x)) is identity', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = withAnsweredAt(element, date)
        const retrieved = getAnsweredAt(withDate)
        expect(retrieved).toEqual(date)
      })
    )
  })

  test('property: with(undefined) removes extension', () => {
    fc.assert(
      fc.property(backboneElementArb, dateTimeArb, (element, date) => {
        const withDate = withAnsweredAt(element, date)
        const removed = withAnsweredAt(withDate, undefined)
        const retrieved = getAnsweredAt(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
