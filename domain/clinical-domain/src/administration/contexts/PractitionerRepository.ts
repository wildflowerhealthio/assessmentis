import { Context } from 'effect'
import { ClinicalDataRepository } from '../../types'
import { Practitioner } from '../resources/Practitioner'

export class PractitionerRepository extends Context.Tag(
  'PractitionerRepository'
)<PractitionerRepository, ClinicalDataRepository<Practitioner>>() {}
