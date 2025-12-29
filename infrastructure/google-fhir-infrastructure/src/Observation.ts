import { Layer } from 'effect'
import {
  ObservationRepository,
  Observation,
  ObservationId,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ObservationConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class ObservationGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Observation.Type,
  typeof Observation.Encoded,
  ObservationId
> {
  constructor(config: ObservationConfig) {
    super('Observation', Observation, config)
  }
}

export const Repository = (config: ObservationConfig) => {
  return Layer.succeed(
    ObservationRepository,
    new ObservationGoogleFhirRepository(config)
  )
}
