import { Context } from 'effect'
import type { ClinicalDataRepository } from '../../types'
import type { Patient } from '../resources/Patient'

export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  ClinicalDataRepository<Patient>
>() {}
