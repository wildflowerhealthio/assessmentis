import { Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { Questionnaire } from '@assessmentis/clinical-domain'

import { questionnaireTemplates } from './index'

describe('questionnaireTemplates', () => {
  it('each template encodes as a Questionnaire', () => {
    fc.assert(
      fc.property(fc.constantFrom(...questionnaireTemplates), (template) => {
        const encoded = Schema.encodeSync(Questionnaire)(template)
        expect(encoded.resourceType).toBe('Questionnaire')
      })
    )
  })
})
