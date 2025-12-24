import { Layer } from 'effect'
import {
  PatientRepository,
  Patient,
  PatientId,
} from '@assessmentis/clinical-domain/administration'
import { PatientConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class PatientGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Patient.Type,
  typeof Patient.Encoded,
  PatientId
> {
  constructor(config: PatientConfig) {
    super('Patient', Patient, config)
  }
}

export const Repository = (config: PatientConfig) => {
  return Layer.succeed(
    PatientRepository,
    new PatientGoogleFhirRepository(config)
  )
}
