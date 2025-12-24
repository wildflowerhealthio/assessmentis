import { Context } from 'effect'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'
import { Patient, PatientId } from '../resources/Patient'

export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  BaseClinicalDataRepository<Patient, PatientId>
>() {}
