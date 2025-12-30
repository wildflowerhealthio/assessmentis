import { PatientRepository } from '@assessmentis/clinical-domain/administration'
import {
  formatGender,
  formatDate,
  formatHumanName,
} from '../../../common/utils/fhirDisplay'
import { createResourcePicker } from '../../../common/utils/createResourcePicker'

export const PatientPicker = createResourcePicker({
  repository: PatientRepository,
  formatDisplay: (patient) =>
    formatHumanName(patient.name?.[0], 'Unnamed Patient'),
  formatSecondary: (patient) =>
    `${formatGender(patient.gender)} • Born: ${formatDate(patient.birthDate)}`,
  defaultPlaceholder: 'Select a patient...',
  defaultLabel: 'Patient',
})
