import { Context } from 'effect'
import type { Composition } from '../resources/Composition/Composition'
import type { ClinicalDataRepository } from '../../types'

export class CompositionRepository extends Context.Tag('CompositionRepository')<
  CompositionRepository,
  ClinicalDataRepository<Composition>
>() {}
