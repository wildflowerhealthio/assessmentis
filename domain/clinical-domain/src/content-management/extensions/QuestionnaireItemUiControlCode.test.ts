import { expect, test, describe } from 'vitest'
import {
  QuestionnaireItemUIControlCode,
  getUiControlCode,
  withUiControlCode,
} from './QuestionnaireItemUiControlCode'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { BackboneElement } from '../../data-types/base/BackboneElement'

const TestBackboneElement = BackboneElement(Schema.String)
const backboneElementArb = Arbitrary.make(TestBackboneElement)
const controlCodeArb = Arbitrary.make(QuestionnaireItemUIControlCode)

describe('QuestionnaireItemUiControlCode extension', () => {
  test('property: get(with(x)) is identity', () => {
    fc.assert(
      fc.property(backboneElementArb, controlCodeArb, (element, code) => {
        const withCode = withUiControlCode(element, code)
        const retrieved = getUiControlCode(withCode)
        expect(retrieved).toEqual(code)
      })
    )
  })

  test('property: with(undefined) removes extension', () => {
    fc.assert(
      fc.property(backboneElementArb, controlCodeArb, (element, code) => {
        const withCode = withUiControlCode(element, code)
        const removed = withUiControlCode(withCode, undefined)
        const retrieved = getUiControlCode(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
