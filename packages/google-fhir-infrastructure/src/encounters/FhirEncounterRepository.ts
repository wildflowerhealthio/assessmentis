import { Layer, Effect } from 'effect'
import { EncounterRepository, Encounter } from '@assessmentis/domain/encounters'
import { FhirClient, LiveFhirClient } from '../FhirLiveLayer'

export const FhirEncounterRepository = Layer.effect(
  EncounterRepository,
  Effect.gen(function* () {
    const { getAll, create, getById, deleteById } = yield* FhirClient

    const createEncounter: typeof EncounterRepository.Service.createEncounter =
      create('Encounter', Encounter)

    const getEncounter: typeof EncounterRepository.Service.getEncounter =
      getById('Encounter', Encounter)

    const getEncounters: typeof EncounterRepository.Service.getEncounters =
      getAll('Encounter', Encounter)

    const deleteEncounter: typeof EncounterRepository.Service.deleteEncounter =
      deleteById('Encounter', Encounter)

    return {
      getEncounter,
      createEncounter,
      getEncounters,
      deleteEncounter,
    }
  })
).pipe(Layer.provide(LiveFhirClient))
