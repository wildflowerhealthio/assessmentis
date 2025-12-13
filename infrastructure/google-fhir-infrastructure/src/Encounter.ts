import { EncounterRepository, Encounter } from '@assessmentis/clinical-domain'
import { EncounterConfig } from '@assessmentis/config-domain/googleFhir'
import { createStandardRepository } from './BaseGoogleFhirRepository'

export const Repository = (config: EncounterConfig) =>
  createStandardRepository(
    EncounterRepository,
    'Encounter',
    Encounter,
    config,
    ({ getById, getAll, create, update, deleteById }) => ({
      getEncounter: getById,
      getEncounters: getAll,
      createEncounter: create,
      updateEncounter: update,
      deleteEncounter: deleteById,
    })
  )
