import { Layer, Effect } from 'effect'
import { EncounterRepository, Encounter } from '@assessmentis/clinical-domain'
import { EncounterConfig } from '@assessmentis/config-domain/googleFhir'

import * as Base from './Base'

export const Repository = (config: EncounterConfig) =>
  Layer.effect(
    EncounterRepository,
    Effect.gen(function* () {
      const { getAll, create, getById, deleteById, update } =
        yield* Base.BaseGoogleFhirStoreClient

      const createEncounter: typeof EncounterRepository.Service.createEncounter =
        create('Encounter', Encounter)

      const getEncounter: typeof EncounterRepository.Service.getEncounter =
        getById('Encounter', Encounter)

      const getEncounters: typeof EncounterRepository.Service.getEncounters =
        getAll('Encounter', Encounter)

      const updateEncounter: typeof EncounterRepository.Service.updateEncounter =
        update('Encounter', Encounter)

      const deleteEncounter: typeof EncounterRepository.Service.deleteEncounter =
        deleteById('Encounter', Encounter)

      return {
        getEncounter,
        createEncounter,
        updateEncounter,
        getEncounters,
        deleteEncounter,
      }
    })
  ).pipe(Layer.provide(Base.LiveClient(config)))
