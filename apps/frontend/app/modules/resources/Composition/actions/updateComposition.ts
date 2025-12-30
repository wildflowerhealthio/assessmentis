import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import {
  transformToComposition,
  CompositionFormData,
} from '../schemas/CompositionFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateComposition = createResourceUpdateAction<
  CompositionFormData,
  Composition,
  CompositionId,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  typeof CompositionRepository,
  ClientRuntimeContext
>(CompositionRepository, transformToComposition)
