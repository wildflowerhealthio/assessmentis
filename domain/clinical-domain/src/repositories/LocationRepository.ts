import { Context } from 'effect'

import type { Location } from '../resources/Location/Location'
import type { ClinicalDataRepository } from '../types'

export class LocationRepository extends Context.Tag('LocationRepository')<
  LocationRepository,
  ClinicalDataRepository<Location>
>() {}
