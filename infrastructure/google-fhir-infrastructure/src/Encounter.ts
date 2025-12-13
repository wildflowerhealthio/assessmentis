import { Layer } from 'effect'
import {
  EncounterRepository,
  Encounter,
  EncounterId,
} from '@assessmentis/clinical-domain'
import { EncounterConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class EncounterGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Encounter.Type,
  typeof Encounter.Encoded,
  EncounterId
> {
  constructor(config: EncounterConfig) {
    super('Encounter', Encounter, config)
  }
}

export const Repository = (config: EncounterConfig) => {
  return Layer.succeed(
    EncounterRepository,
    new EncounterGoogleFhirRepository(config)
  )
}
