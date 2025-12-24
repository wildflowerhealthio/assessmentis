import { Context } from 'effect'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'
import { Practitioner, PractitionerId } from '../resources/Practitioner'

export class PractitionerRepository extends Context.Tag(
  'PractitionerRepository'
)<
  PractitionerRepository,
  BaseClinicalDataRepository<Practitioner, PractitionerId>
>() {}
