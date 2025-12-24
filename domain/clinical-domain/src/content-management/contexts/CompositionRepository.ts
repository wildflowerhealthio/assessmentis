import { Context } from 'effect'
import {
  Composition,
  CompositionId,
} from '../resources/Composition/Composition'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'

export class CompositionRepository extends Context.Tag('CompositionRepository')<
  CompositionRepository,
  BaseClinicalDataRepository<Composition, CompositionId>
>() {}
