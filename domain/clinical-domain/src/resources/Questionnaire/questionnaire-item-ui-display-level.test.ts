import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { BackboneElement } from '../../data-types/base/backbone-element'
import {
  QuestionnaireItemUiDisplayLevel,
  getUiDisplayLevel,
  withUiDisplayLevel,
} from './questionnaire-item-ui-display-level'

const TestBackboneElement = BackboneElement('Test')
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
        // eslint-disable-next-line unicorn/no-useless-undefined -- testing removal by passing undefined
        const removed = withUiDisplayLevel(withLevel, undefined)
        const retrieved = getUiDisplayLevel(removed)
        expect(retrieved).toBeUndefined()
      })
    )
  })
})
