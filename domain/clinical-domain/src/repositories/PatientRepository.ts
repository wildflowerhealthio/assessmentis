import { Context } from 'effect'

import type { Patient } from '../resources/Patient/Patient'
import type { ClinicalDataRepository } from '../types'

export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  ClinicalDataRepository<Patient>
>() {}
