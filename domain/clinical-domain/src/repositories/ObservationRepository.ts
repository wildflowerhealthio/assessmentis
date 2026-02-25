import { Context } from 'effect'
import type { ClinicalDataRepository } from '../types'
import type { Observation } from '../resources/Observation/Observation'

export class ObservationRepository extends Context.Tag('ObservationRepository')<
  ObservationRepository,
  ClinicalDataRepository<Observation>
>() {}
