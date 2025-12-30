import { PractitionerRepository } from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const usePractitionerCollection = createResourceCollectionHook({
  repository: PractitionerRepository,
})
