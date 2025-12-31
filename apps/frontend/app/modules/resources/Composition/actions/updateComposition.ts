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

export const updateComposition = createResourceUpdateAction<
  CompositionFormData,
  CompositionId,
  Composition,
  CompositionRepository['Id'],
  InstanceType<typeof CompositionRepository>
>(CompositionRepository, transformToComposition)
