import type { Composition } from '@assessmentis/clinical-domain/content-management'
import type { CompositionFormData } from '../schemas/CompositionFormSchema'
import { transformToComposition } from '../schemas/CompositionFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createComposition = createResourceCreateAction<
  CompositionFormData,
  Composition
>('Composition', transformToComposition)
