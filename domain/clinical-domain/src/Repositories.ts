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
  [Composition.Composition.Key]: CompositionRepository,
  [Encounter.Encounter.Key]: EncounterRepository,
  [Location.Location.Key]: LocationRepository,
  [Media.Media.Key]: MediaRepository,
  [Observation.Observation.Key]: ObservationRepository,
  [Patient.Patient.Key]: PatientRepository,
  [Practitioner.Practitioner.Key]: PractitionerRepository,
  [Questionnaire.Questionnaire.Key]: QuestionnaireRepository,
  [QuestionnaireResponse.QuestionnaireResponse.Key]:
    QuestionnaireResponseRepository,
} as const

export interface RepositoriesType {
  [Composition.Composition.Key]: typeof CompositionRepository
  [Encounter.Encounter.Key]: typeof EncounterRepository
  [Location.Location.Key]: typeof LocationRepository
  [Media.Media.Key]: typeof MediaRepository
  [Observation.Observation.Key]: typeof ObservationRepository
  [Patient.Patient.Key]: typeof PatientRepository
  [Practitioner.Practitioner.Key]: typeof PractitionerRepository
  [Questionnaire.Questionnaire.Key]: typeof QuestionnaireRepository
  [QuestionnaireResponse.QuestionnaireResponse
    .Key]: typeof QuestionnaireResponseRepository
}

export default Repositories
