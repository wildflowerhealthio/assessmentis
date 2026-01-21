import { Composition } from '@assessmentis/clinical-domain/content-management'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createComposition = createResourceCreateAction<
  CompositionFormData,
  Composition
>('Composition', transformToComposition)
