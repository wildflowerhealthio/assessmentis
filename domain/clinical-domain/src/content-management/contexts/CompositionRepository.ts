import { Context } from 'effect'
import { Composition } from '../resources/Composition/Composition'
import { ClinicalDataRepository } from '../../types'

export class CompositionRepository extends Context.Tag('CompositionRepository')<
  CompositionRepository,
  ClinicalDataRepository<Composition>
>() {}
