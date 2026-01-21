import { Context } from 'effect'
import { Encounter } from '../resources/Encounter'

import { ClinicalDataRepository } from '../../types'

export class EncounterRepository extends Context.Tag('EncounterRepository')<
  EncounterRepository,
  ClinicalDataRepository<Encounter>
>() {}
