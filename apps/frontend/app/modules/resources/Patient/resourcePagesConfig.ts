import { Schema } from 'effect'

import type { Patient } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { PatientForm } from './components/PatientForm'
import {
  PatientFormSchema,
  transformToPatient,
  type PatientFormData,
} from './schemas/PatientFormSchema'
import { getPatientDisplayName } from './utils/patientDisplay'

export const patientConfig: ResourcePagesConfig<
  Patient,
  typeof PatientFormSchema
> = {
  resourceType: 'Patient',
  singularLabel: 'Patient',
  pluralLabel: 'Patients',
  paramName: 'patientId',

  decodeUrl: (raw: string) => Schema.decodeOption(ReadonlyUrl.FromString)(raw),
  getDisplayName: getPatientDisplayName,

  schema: PatientFormSchema,
  FormComponent: PatientForm,

  defaultFormValues: {
    givenName: '',
    familyName: '',
    gender: undefined,
    birthDate: undefined,
    practitionerUrl: undefined,
  },

  extractFormValues: (patient) => ({
    givenName: patient.name?.[0]?.given?.[0] ?? '',
    familyName: patient.name?.[0]?.family ?? '',
    gender: patient.gender,
    birthDate: patient.birthDate,
    practitionerUrl: patient.generalPractitioner?.[0]?.reference,
  }),

  createAction: createResourceCreateAction<PatientFormData, 'Patient'>(
    'Patient',
    transformToPatient
  ),
  updateAction: createResourceUpdateAction<PatientFormData, 'Patient'>(
    'Patient',
    transformToPatient
  ),

  getListSummaryItems: (patient) => [
    patient.gender ?? '-',
    `Born: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown'}`,
    ...(patient.active === false ? ['Inactive'] : []),
  ],
}
