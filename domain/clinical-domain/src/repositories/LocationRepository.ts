import { Context } from 'effect'
import type { ClinicalDataRepository } from '../types'
import type { Location } from '../resources/Location/Location'

export class LocationRepository extends Context.Tag('LocationRepository')<
  LocationRepository,
  ClinicalDataRepository<Location>
>() {}
