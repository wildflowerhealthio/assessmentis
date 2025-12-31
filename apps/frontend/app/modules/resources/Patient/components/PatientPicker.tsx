import { PatientRepository } from '@assessmentis/clinical-domain/administration'
import {
  formatGender,
  formatHumanName,
} from '../../../common/utils/fhirDisplay'
import { humanizeTimelessDate } from '../../../common/utils/dateUtils'
import { createResourcePicker } from '../../../common/utils/createResourcePicker'

export const PatientPicker = createResourcePicker({
  repository: PatientRepository,
  formatDisplay: (patient) =>
    formatHumanName(patient.name?.[0], 'Unnamed Patient'),
  formatSecondary: (patient) =>
    `${formatGender(patient.gender)} • Born: ${humanizeTimelessDate(patient.birthDate)}`,
  defaultPlaceholder: 'Select a patient...',
  defaultLabel: 'Patient',
})
