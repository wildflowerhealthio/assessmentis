import { Layer } from 'effect'
import {
  PractitionerRepository,
  Practitioner,
  PractitionerId,
} from '@assessmentis/clinical-domain/administration'
import { PractitionerConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class PractitionerGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Practitioner.Type,
  typeof Practitioner.Encoded,
  PractitionerId
> {
  constructor(config: PractitionerConfig) {
    super('Practitioner', Practitioner, config)
  }
}

export const Repository = (config: PractitionerConfig) => {
  return Layer.succeed(
    PractitionerRepository,
    new PractitionerGoogleFhirRepository(config)
  )
}
