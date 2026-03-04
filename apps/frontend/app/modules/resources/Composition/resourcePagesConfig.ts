import { Schema } from 'effect'
import type { Composition } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
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

export const compositionConfig: ResourcePagesConfig<
  Composition,
  typeof CompositionFormSchema
> = {
  resourceType: 'Composition',
  singularLabel: 'Composition',
  pluralLabel: 'Compositions',
  paramName: 'compositionId',

  decodeUrl: (raw: string) => Schema.decodeOption(ReadonlyUrl.FromString)(raw),
  getDisplayName: getCompositionDisplayName,

  schema: CompositionFormSchema,
  FormComponent: CompositionForm,

  defaultFormValues: {
    title: '',
    patientUrl: undefined,
  },

  extractFormValues: (composition) => ({
    title: composition.title ?? '',
    patientUrl: composition.subject?.reference,
  }),

  createAction: createResourceCreateAction<CompositionFormData, 'Composition'>(
    'Composition',
    transformToComposition
  ),
  updateAction: createResourceUpdateAction<CompositionFormData, 'Composition'>(
    'Composition',
    transformToComposition
  ),

  getListSummaryItems: (composition) => [
    getCompositionType(composition),
    composition.status,
    new Date(composition.date.epochMillis).toLocaleDateString(),
  ],
}
