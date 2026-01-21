import { Context } from 'effect'
import { ClinicalDataRepository } from '../../types'
import { Patient } from '../resources/Patient'

export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  ClinicalDataRepository<Patient>
>() {}
