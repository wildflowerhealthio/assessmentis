import { Context } from 'effect'
import type { ClinicalDataRepository } from '../../types'
import type { Observation } from '../resources'

export class ObservationRepository extends Context.Tag('ObservationRepository')<
  ObservationRepository,
  ClinicalDataRepository<Observation>
>() {}
