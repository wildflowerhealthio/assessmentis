import { Context } from 'effect'

import type { Practitioner } from '../resources/Practitioner/Practitioner'
import type { ClinicalDataRepository } from '../types'

export class PractitionerRepository extends Context.Tag(
  'PractitionerRepository'
)<PractitionerRepository, ClinicalDataRepository<Practitioner>>() {}
