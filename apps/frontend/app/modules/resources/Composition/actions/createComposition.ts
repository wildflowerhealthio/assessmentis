import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createComposition = createResourceCreateAction<
  CompositionFormData,
  CompositionId,
  Composition,
  CompositionRepository['Id'],
  InstanceType<typeof CompositionRepository>
>(CompositionRepository, transformToComposition)
