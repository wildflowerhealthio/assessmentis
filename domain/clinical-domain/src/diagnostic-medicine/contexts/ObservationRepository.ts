import { Context } from 'effect'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'
import { Observation, ObservationId } from '../resources'

export class ObservationRepository extends Context.Tag('ObservationRepository')<
  ObservationRepository,
  BaseClinicalDataRepository<Observation, ObservationId>
>() {}
