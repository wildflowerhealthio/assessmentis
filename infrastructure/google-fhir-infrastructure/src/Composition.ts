import { Layer } from 'effect'
import {
  CompositionRepository,
  Composition,
  CompositionId,
} from '@assessmentis/clinical-domain/content-management'
import { CompositionConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class CompositionGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Composition.Type,
  typeof Composition.Encoded,
  CompositionId
> {
  constructor(config: CompositionConfig) {
    super('Composition', Composition, config)
  }
}

export const Repository = (config: CompositionConfig) => {
  return Layer.succeed(
    CompositionRepository,
    new CompositionGoogleFhirRepository(config)
  )
}
