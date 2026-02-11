import type { Composition } from '@assessmentis/clinical-domain/content-management'
import type { CompositionFormData } from '../schemas/CompositionFormSchema'
import { transformToComposition } from '../schemas/CompositionFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateComposition = createResourceUpdateAction<
  CompositionFormData,
  Composition
>('Composition', transformToComposition)
