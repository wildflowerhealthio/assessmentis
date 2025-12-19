import { describe, test } from 'vitest'
import fc from 'fast-check'
import { SectionRenderers } from '@assessmentis/document-template-kinds/gad7-report'
import * as Base from './index'

const _base: SectionRenderers<JSX.Element> = Base

describe('Base GAD-7 Template', () => {
  test('It exists', () => {
    fc.assert(fc.property(fc.boolean(), (_) => true))
  })
})
