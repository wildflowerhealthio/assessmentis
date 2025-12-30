import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useCompositionCollection = createResourceCollectionHook<
  CompositionRepository,
  CompositionId,
  Composition,
  typeof CompositionRepository
>({
  repository: CompositionRepository,
})
