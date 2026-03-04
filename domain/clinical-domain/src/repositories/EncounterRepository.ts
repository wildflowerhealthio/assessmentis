import { Context } from 'effect'

import type { Encounter } from '../resources/Encounter/Encounter'
import type { ClinicalDataRepository } from '../types'

export class EncounterRepository extends Context.Tag('EncounterRepository')<
  EncounterRepository,
  ClinicalDataRepository<Encounter>
>() {}
