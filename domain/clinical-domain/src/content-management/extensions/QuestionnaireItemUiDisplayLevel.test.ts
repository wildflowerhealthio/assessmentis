import { expect, test, describe } from 'vitest'
import {
  QuestionnaireItemUiDisplayLevel,
  getUiDisplayLevel,
  withUiDisplayLevel,
} from './QuestionnaireItemUiDisplayLevel'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { BackboneElement } from '../../data-types/base/BackboneElement'

const TestBackboneElement = BackboneElement.Schema(Schema.String)
const backboneElementArb = Arbitrary.make(TestBackboneElement)
const displayLevelArb = Arbitrary.make(QuestionnaireItemUiDisplayLevel)

describe('QuestionnaireItemUiDisplayLevel extension', () => {
  test('property: get(with(x)) is identity', () => {
    fc.assert(
      fc.property(backboneElementArb, displayLevelArb, (element, level) => {
        const withLevel = withUiDisplayLevel(element, level)
        const retrieved = getUiDisplayLevel(withLevel)
        expect(retrieved).toEqual(level)
      })
    )
  })

  test('property: with(undefined) removes extension', () => {
    fc.assert(
      fc.property(backboneElementArb, displayLevelArb, (element, level) => {
        const withLevel = withUiDisplayLevel(element, level)
        const removed = withUiDisplayLevel(withLevel, undefined)
        const retrieved = getUiDisplayLevel(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
