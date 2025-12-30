import { EncounterRepository } from '@assessmentis/clinical-domain/administration'
import { createResourcePicker } from '../../../common/utils/createResourcePicker'

function formatEncounterDisplay(encounter: { id?: string }): string {
  return `Encounter ${encounter.id || 'Unknown'}`
}

function formatEncounterSecondary(encounter: {
  class?: { display?: string; code?: string }
  status?: string
}): string {
  const encounterClass =
    encounter.class?.display || encounter.class?.code || 'Unknown class'
  const status = encounter.status || 'unknown'

  return `${encounterClass} • Status: ${status}`
}

export const EncounterPicker = createResourcePicker({
  repository: EncounterRepository,
  formatDisplay: formatEncounterDisplay,
  formatSecondary: formatEncounterSecondary,
  defaultPlaceholder: 'Select an encounter...',
  defaultLabel: 'Encounter',
})
