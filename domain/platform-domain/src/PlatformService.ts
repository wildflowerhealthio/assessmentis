import { Context, Layer } from 'effect'
import { Resource } from '@effect/opentelemetry'
import { CurrentUserIdError, UserId } from './loadedValues/UserId'
import { type CurrentUserError, type User } from './loadedValues/User'
import { LoadedResultStream } from '@assessmentis/util/LoadedResult'
import { CurrentTimeZone } from 'effect/DateTime'
import {
  ExternalVideoCallClient,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  EncounterRepository,
  MediaRepository,
  DiagnosticReportTemplateRepository,
  TemplateRenderer,
} from '@assessmentis/clinical-domain'
import { HttpClient } from '@effect/platform'
import { Org, OrgError } from './loadedValues/Org'

export type ClientRuntimeContext =
  | Resource.Resource
  | HttpClient.HttpClient
  | CurrentTimeZone
  | ExternalVideoCallClient
  | QuestionnaireRepository
  | QuestionnaireResponseRepository
  | EncounterRepository
  | MediaRepository
  | DiagnosticReportTemplateRepository
  | TemplateRenderer

export class PlatformService extends Context.Tag('PlatformService')<
  PlatformService,
  {
    currentUserId: LoadedResultStream<UserId, CurrentUserIdError>

    currentUser: LoadedResultStream<User, CurrentUserError>

    org: LoadedResultStream<Org, OrgError>

    runtime: LoadedResultStream<
      Layer.Layer<ClientRuntimeContext, never>,
      OrgError
    >
  }
>() {}
