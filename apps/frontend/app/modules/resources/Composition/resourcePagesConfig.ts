import { Schema } from 'effect'
import type { Composition } from '@assessmentis/clinical-domain/content-management'
import { CompositionId } from '@assessmentis/clinical-domain/content-management'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { CompositionForm } from './components/CompositionForm'
import {
  CompositionFormSchema,
  transformToComposition,
  type CompositionFormData,
} from './schemas/CompositionFormSchema'
import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import {
  getCompositionDisplayName,
  getCompositionType,
} from './utils/compositionDisplay'
import { extractReferenceId } from '../../common/utils/fhirDisplay'

export const compositionConfig: ResourcePagesConfig<
  Composition,
  typeof CompositionFormSchema
> = {
  resourceType: 'Composition',
  singularLabel: 'Composition',
  pluralLabel: 'Compositions',
  paramName: 'compositionId',

  decodeId: (raw) => Schema.decodeOption(CompositionId)(raw),
  getDisplayName: getCompositionDisplayName,

  schema: CompositionFormSchema,
  FormComponent: CompositionForm,

  defaultFormValues: {
    title: '',
    patientId: undefined,
  },

  extractFormValues: (composition) => ({
    title: composition.title ?? '',
    patientId: extractReferenceId(composition.subject),
  }),

  createAction: createResourceCreateAction<CompositionFormData, Composition>(
    'Composition',
    transformToComposition
  ),
  updateAction: createResourceUpdateAction<CompositionFormData, Composition>(
    'Composition',
    transformToComposition
  ),

  getListSummaryItems: (composition) => [
    getCompositionType(composition),
    composition.status,
    new Date(composition.date.epochMillis).toLocaleDateString(),
  ],
}
