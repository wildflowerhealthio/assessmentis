import { Schema } from 'effect'
import type { Patient } from '@assessmentis/clinical-domain/administration'
import { PatientId } from '@assessmentis/clinical-domain/administration'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { PatientForm } from './components/PatientForm'
import {
  PatientFormSchema,
  transformToPatient,
  type PatientFormData,
} from './schemas/PatientFormSchema'
import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import { getPatientDisplayName } from './utils/patientDisplay'
import { extractReferenceId } from '../../common/utils/fhirDisplay'

export const patientConfig: ResourcePagesConfig<
  Patient,
  typeof PatientFormSchema
> = {
  resourceType: 'Patient',
  singularLabel: 'Patient',
  pluralLabel: 'Patients',
  paramName: 'patientId',

  decodeId: (raw) => Schema.decodeOption(PatientId)(raw),
  getDisplayName: getPatientDisplayName,

  schema: PatientFormSchema,
  FormComponent: PatientForm,

  defaultFormValues: {
    givenName: '',
    familyName: '',
    gender: undefined,
    birthDate: undefined,
    practitionerId: undefined,
  },

  extractFormValues: (patient) => ({
    givenName: patient.name?.[0]?.given?.[0] ?? '',
    familyName: patient.name?.[0]?.family ?? '',
    gender: patient.gender,
    birthDate: patient.birthDate,
    practitionerId: extractReferenceId(patient.generalPractitioner?.[0]),
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
