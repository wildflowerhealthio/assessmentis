import { Context } from 'effect'
import { Encounter, EncounterId } from '../resources/Encounter'

import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'

export class EncounterRepository extends Context.Tag('EncounterRepository')<
  EncounterRepository,
  BaseClinicalDataRepository<Encounter, EncounterId>
>() {}
