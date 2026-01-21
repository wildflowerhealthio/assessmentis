import { Composition } from '@assessmentis/clinical-domain/content-management'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateComposition = createResourceUpdateAction<
  CompositionFormData,
  Composition
>('Composition', transformToComposition)
