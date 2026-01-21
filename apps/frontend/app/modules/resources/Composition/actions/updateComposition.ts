import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'
import { Effect } from 'effect'
import { ClinicalDataRepositoryErrorsWithNotFound } from '@assessmentis/clinical-domain'

export const updateComposition = createResourceUpdateAction<
  CompositionFormData,
  Composition
>('Composition', transformToComposition)
