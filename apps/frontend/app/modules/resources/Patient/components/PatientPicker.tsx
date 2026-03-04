import type { Patient } from '@assessmentis/clinical-domain'

import { createResourcePicker } from '../../../common/utils/createResourcePicker'
import { humanizeTimelessDate } from '../../../common/utils/dateUtils'
import {
  formatGender,
  formatHumanName,
} from '../../../common/utils/fhirDisplay'

export const PatientPicker = createResourcePicker({
  resourceType: 'Patient',
  formatDisplay: (patient: Patient) =>
    formatHumanName(patient.name?.[0], 'Unnamed Patient'),
  formatSecondary: (patient: Patient) =>
    `${formatGender(patient.gender)} • Born: ${humanizeTimelessDate(patient.birthDate)}`,
  defaultPlaceholder: 'Select a patient...',
  defaultLabel: 'Patient',
})
