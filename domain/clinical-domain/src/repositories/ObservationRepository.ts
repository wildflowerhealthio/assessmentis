import { Context } from 'effect'

import type { Observation } from '../resources/Observation/Observation'
import type { ClinicalDataRepository } from '../types'

export class ObservationRepository extends Context.Tag('ObservationRepository')<
  ObservationRepository,
  ClinicalDataRepository<Observation>
>() {}
