import { Context, Layer } from 'effect'
import { Resource } from '@effect/opentelemetry'

import { FrontendConfig } from './loadedValues/FrontendConfig'
import { CurrentUserIdError, UserId } from './loadedValues/UserId'
import { type CurrentUserError, type User } from './loadedValues/User'
import { OrgRole, OrgRoleError } from './loadedValues/OrgRole'
import { FrontendConfigError } from './loadedValues/FrontendConfig'
import { LoadedResultStream } from '@assessmentis/util/LoadedResult'
import { CurrentTimeZone } from 'effect/DateTime'
import {
  ExternalVideoCallClient,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  EncounterRepository,
} from '@assessmentis/clinical-domain'
import { HttpClient } from '@effect/platform'

export type ClientRuntimeContext =
  | Resource.Resource
  | HttpClient.HttpClient
  | CurrentTimeZone
  | ExternalVideoCallClient
  | QuestionnaireRepository
  | QuestionnaireResponseRepository
  | EncounterRepository

export class PlatformService extends Context.Tag('PlatformService')<
  PlatformService,
  {
    currentUserId: LoadedResultStream<UserId, CurrentUserIdError>

    currentUser: LoadedResultStream<User, CurrentUserError>

    orgRole: LoadedResultStream<OrgRole, OrgRoleError>

    frontendConfig: LoadedResultStream<FrontendConfig, FrontendConfigError>

    runtime: LoadedResultStream<
      Layer.Layer<ClientRuntimeContext, never>,
      FrontendConfigError
    >
  }
>() {}
