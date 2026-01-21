import { Resource } from '@effect/opentelemetry'
import { CurrentTimeZone } from 'effect/DateTime'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import {
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  EncounterRepository,
  PatientRepository,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  MediaRepository,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { HttpClient } from '@effect/platform'

export type ClientRuntimeContext =
  | Resource.Resource
  | HttpClient.HttpClient
  | CurrentTimeZone
  | ExternalVideoCallClient
  | QuestionnaireRepository
  | QuestionnaireResponseRepository
  | CompositionRepository
  | EncounterRepository
  | MediaRepository
  | ObservationRepository
  | PatientRepository
  | PractitionerRepository
