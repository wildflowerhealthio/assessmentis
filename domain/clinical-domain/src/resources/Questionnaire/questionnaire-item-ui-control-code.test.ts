import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { BackboneElement } from '../../data-types/base/backbone-element'
import {
  QuestionnaireItemUIControlCode,
  getUiControlCode,
  withUiControlCode,
} from './questionnaire-item-ui-control-code'

const TestBackboneElement = BackboneElement('Test')
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
        // oxlint-disable-next-line unicorn/no-useless-undefined -- testing removal by passing undefined
        const removed = withUiControlCode(withCode, undefined)
        const retrieved = getUiControlCode(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
