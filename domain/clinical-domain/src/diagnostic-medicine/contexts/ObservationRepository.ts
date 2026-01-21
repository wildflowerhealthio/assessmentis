import { Context } from 'effect'
import { ClinicalDataRepository } from '../../types'
import { Observation } from '../resources'

export class ObservationRepository extends Context.Tag('ObservationRepository')<
  ObservationRepository,
  ClinicalDataRepository<Observation>
>() {}
