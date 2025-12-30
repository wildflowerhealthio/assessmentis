import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const usePractitionerCollection = createResourceCollectionHook<
  PractitionerRepository,
  PractitionerId,
  Practitioner,
  typeof PractitionerRepository
>({
  repository: PractitionerRepository,
})
