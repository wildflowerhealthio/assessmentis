import { Schema } from 'effect'
import { Practitioner } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { PractitionerForm } from './components/PractitionerForm'
import {
  PractitionerFormSchema,
  transformToPractitioner,
  type PractitionerFormData,
} from './schemas/PractitionerFormSchema'
import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import {
  getPractitionerDisplayName,
  getPractitionerQualification,
} from './utils/practitionerDisplay'

export const practitionerConfig: ResourcePagesConfig<
  Practitioner,
  typeof PractitionerFormSchema
> = {
  resourceType: 'Practitioner',
  singularLabel: 'Practitioner',
  pluralLabel: 'Practitioners',
  paramName: 'practitionerId',

  decodeUrl: (raw: string) => Schema.decodeOption(ReadonlyUrl.FromString)(raw),
  getDisplayName: getPractitionerDisplayName,

  schema: PractitionerFormSchema,
  FormComponent: PractitionerForm,

  defaultFormValues: {
    givenName: '',
    familyName: '',
    gender: undefined,
    qualification: undefined,
  },

  extractFormValues: (practitioner) => ({
    givenName: practitioner.name?.[0]?.given?.[0] ?? '',
    familyName: practitioner.name?.[0]?.family ?? '',
    gender: practitioner.gender ?? undefined,
    qualification: practitioner.qualification?.[0]?.code?.text ?? undefined,
  }),

  createAction: createResourceCreateAction<
    PractitionerFormData,
    'Practitioner'
  >('Practitioner', transformToPractitioner),
  updateAction: createResourceUpdateAction<
    PractitionerFormData,
    'Practitioner'
  >('Practitioner', transformToPractitioner),

  getListSummaryItems: (practitioner) => [
    practitioner.gender ?? 'Unknown',
    getPractitionerQualification(practitioner),
    ...(practitioner.active === false ? ['Inactive'] : []),
  ],
}
