import { CompositionRepository } from '@assessmentis/clinical-domain/content-management'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useCompositionCollection = createResourceCollectionHook({
  repository: CompositionRepository,
})
