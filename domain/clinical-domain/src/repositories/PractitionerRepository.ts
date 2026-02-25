import { Context } from 'effect'
import type { ClinicalDataRepository } from '../types'
import type { Practitioner } from '../resources/Practitioner/Practitioner'

export class PractitionerRepository extends Context.Tag(
  'PractitionerRepository'
)<PractitionerRepository, ClinicalDataRepository<Practitioner>>() {}
