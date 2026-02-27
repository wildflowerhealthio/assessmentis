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
  [Composition.Key]: CompositionRepository,
  [Encounter.Key]: EncounterRepository,
  [Location.Key]: LocationRepository,
  [Media.Key]: MediaRepository,
  [Observation.Key]: ObservationRepository,
  [Patient.Key]: PatientRepository,
  [Practitioner.Key]: PractitionerRepository,
  [Questionnaire.Key]: QuestionnaireRepository,
  [QuestionnaireResponse.Key]: QuestionnaireResponseRepository,
} as const

export interface RepositoriesType {
  [Composition.Key]: typeof CompositionRepository
  [Encounter.Key]: typeof EncounterRepository
  [Location.Key]: typeof LocationRepository
  [Media.Key]: typeof MediaRepository
  [Observation.Key]: typeof ObservationRepository
  [Patient.Key]: typeof PatientRepository
  [Practitioner.Key]: typeof PractitionerRepository
  [Questionnaire.Key]: typeof QuestionnaireRepository
  [QuestionnaireResponse.Key]: typeof QuestionnaireResponseRepository
}

export default Repositories
