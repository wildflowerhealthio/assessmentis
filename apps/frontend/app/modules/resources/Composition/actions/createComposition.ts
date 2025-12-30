import { CompositionRepository } from '@assessmentis/clinical-domain/content-management'
import { transformToComposition } from '../schemas/CompositionFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createComposition = createResourceCreateAction(
  CompositionRepository,
  transformToComposition
)
