import { CompositionRepository } from '@assessmentis/clinical-domain/content-management'
import { transformToComposition } from '../schemas/CompositionFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateComposition = createResourceUpdateAction(
  CompositionRepository,
  transformToComposition
)
