import {
  EncounterRepository,
  LocationRepository,
  PatientRepository,
  PractitionerRepository,
} from './administration'
import {
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from './content-management'
import { CompositionRepository } from './content-management'
import { MediaRepository, ObservationRepository } from './diagnostic-medicine'
import type Schemas from './Schemas'
import type { ClinicalDomainRepositoryTagClass } from './types'

const Repositories = {
  Composition: CompositionRepository,
  Encounter: EncounterRepository,
  Location: LocationRepository,
  Media: MediaRepository,
  Observation: ObservationRepository,
  Patient: PatientRepository,
  Practitioner: PractitionerRepository,
  Questionnaire: QuestionnaireRepository,
  QuestionnaireResponse: QuestionnaireResponseRepository,
} as const satisfies {
  readonly [key in keyof typeof Schemas]: ClinicalDomainRepositoryTagClass<key>
}
export interface RepositoriesType {
  Composition: typeof CompositionRepository
  Encounter: typeof EncounterRepository
  Location: typeof LocationRepository
  Media: typeof MediaRepository
  Observation: typeof ObservationRepository
  Patient: typeof PatientRepository
  Practitioner: typeof PractitionerRepository
  Questionnaire: typeof QuestionnaireRepository
  QuestionnaireResponse: typeof QuestionnaireResponseRepository
}

export default Repositories
