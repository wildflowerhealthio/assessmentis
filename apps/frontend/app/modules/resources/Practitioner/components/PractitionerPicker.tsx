import { PractitionerRepository } from '@assessmentis/clinical-domain/administration'
import { formatHumanName } from '../../../common/utils/fhirDisplay'
import { createResourcePicker } from '../../../common/utils/createResourcePicker'

function formatQualification(practitioner: {
  qualification?: ReadonlyArray<{ code?: { text?: string } }>
}): string {
  const qualification = practitioner.qualification?.[0]?.code?.text
  return qualification || 'No qualification listed'
}

export const PractitionerPicker = createResourcePicker({
  repository: PractitionerRepository,
  formatDisplay: (practitioner) =>
    formatHumanName(practitioner.name?.[0], 'Unnamed Practitioner'),
  formatSecondary: (practitioner) => formatQualification(practitioner),
  defaultPlaceholder: 'Select practitioner(s)...',
  defaultLabel: 'Practitioner',
})
