import {
  Composition,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createComposition = createResourceCreateAction<
  CompositionFormData,
  Composition,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  typeof CompositionRepository,
  ClientRuntimeContext
>(CompositionRepository, transformToComposition)
