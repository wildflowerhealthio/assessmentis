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
  const repository = new EncounterGoogleFhirRepository(config)

  return Layer.succeed(EncounterRepository, {
    getEncounter: repository.get.bind(repository),
    getEncounters: repository.getMany.bind(repository),
    createEncounter: repository.create.bind(repository),
    updateEncounter: repository.update.bind(repository),
    deleteEncounter: repository.delete.bind(repository),
  })
}
