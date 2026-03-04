import {
  Composition,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '.'
import { CompositionRepository } from './repositories/CompositionRepository'
import { EncounterRepository } from './repositories/EncounterRepository'
import { LocationRepository } from './repositories/LocationRepository'
import { MediaRepository } from './repositories/MediaRepository'
import { ObservationRepository } from './repositories/ObservationRepository'
import { PatientRepository } from './repositories/PatientRepository'
import { PractitionerRepository } from './repositories/PractitionerRepository'
import { QuestionnaireRepository } from './repositories/QuestionnaireRepository'
import { QuestionnaireResponseRepository } from './repositories/QuestionnaireResponseRepository'

const Repositories = {
  [Composition.DomainType]: CompositionRepository,
  [Encounter.DomainType]: EncounterRepository,
  [Location.DomainType]: LocationRepository,
  [Media.DomainType]: MediaRepository,
  [Observation.DomainType]: ObservationRepository,
  [Patient.DomainType]: PatientRepository,
  [Practitioner.DomainType]: PractitionerRepository,
  [Questionnaire.DomainType]: QuestionnaireRepository,
  [QuestionnaireResponse.DomainType]: QuestionnaireResponseRepository,
} as const

export interface RepositoriesType {
  [Composition.DomainType]: typeof CompositionRepository
  [Encounter.DomainType]: typeof EncounterRepository
  [Location.DomainType]: typeof LocationRepository
  [Media.DomainType]: typeof MediaRepository
  [Observation.DomainType]: typeof ObservationRepository
  [Patient.DomainType]: typeof PatientRepository
  [Practitioner.DomainType]: typeof PractitionerRepository
  [Questionnaire.DomainType]: typeof QuestionnaireRepository
  [QuestionnaireResponse.DomainType]: typeof QuestionnaireResponseRepository
}

export default Repositories
