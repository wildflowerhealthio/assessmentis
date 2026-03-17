import { describe, expect, it } from 'vitest'
import { Schema } from 'effect'

import { Location, Questionnaire } from '@assessmentis/clinical-domain'

import '.'

const decodeLocation = Schema.decodeSync(Location)
const decodeQuestionnaire = Schema.decodeSync(Questionnaire)

describe('Listable trait', () => {
  describe('Location', () => {
    it('uses location name as displayName', () => {
      const location = decodeLocation({ name: 'Clinic A' })
      expect(location.Listable.displayName).toBe('Clinic A')
    })

    it('includes status and mode in summaryItems', () => {
      const location = decodeLocation({
        name: 'Clinic A',
        status: 'active',
        mode: 'instance',
      })
      expect(location.Listable.summaryItems).toEqual(['active', 'instance'])
    })

    it('filters out undefined values from summaryItems', () => {
      const location = decodeLocation({ name: 'Clinic A' })
      expect(location.Listable.summaryItems).toEqual([])
    })
  })

  describe('Questionnaire', () => {
    it('uses title as displayName', () => {
      const q = decodeQuestionnaire({
        status: 'active',
        title: 'PHQ-9',
      })
      expect(q.Listable.displayName).toBe('PHQ-9')
    })

    it('falls back to url when title is missing', () => {
      const q = decodeQuestionnaire({
        status: 'active',
        url: 'http://example.com/Questionnaire/1',
      })
      expect(q.Listable.displayName).toContain('Questionnaire')
    })

    it('includes status in summaryItems', () => {
      const q = decodeQuestionnaire({ status: 'active' })
      expect(q.Listable.summaryItems).toEqual(['Status: active'])
    })
  })
})
