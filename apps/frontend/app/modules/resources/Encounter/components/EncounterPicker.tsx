import { Encounter } from '@assessmentis/clinical-domain'
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

export const EncounterPicker = createResourcePicker<Encounter>({
  resourceType: 'Encounter',
  formatDisplay: formatEncounterDisplay,
  formatSecondary: formatEncounterSecondary,
  defaultPlaceholder: 'Select an encounter...',
  defaultLabel: 'Encounter',
})
