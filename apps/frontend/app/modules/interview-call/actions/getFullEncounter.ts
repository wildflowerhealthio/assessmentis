import { Effect, Equal, Option } from 'effect'

import {
  ClinicalDomainHub,
  Location,
  type Encounter,
  type EncounterLocation,
  type Questionnaire,
  type QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import {
  UnhandledError,
  type AuthError,
  type AuthzError,
  type ExternalAssertionError,
  type NotFoundError,
} from '@assessmentis/ontology'

export type FullEncounter = {
  encounter: Resource.WithResourceUrl<Encounter>
  questionnaireResponses: Array<{
    questionnaireResponse: Resource.WithResourceUrl<QuestionnaireResponse>
    questionnaire: Resource.WithResourceUrl<Questionnaire>
  }>
  locations: Array<Resource.WithResourceUrl<Location>>
}

export const getFullEncounter = (
  encounterUrl: Resource.InferResourceUrl<Encounter>
): Effect.Effect<
  FullEncounter,
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { readonly url: ReadonlyUrl }>
  | NotFoundError<'Location', { readonly url: ReadonlyUrl }>,
  ClinicalDomainHub
> =>
  Effect.gen(function* () {
    const hub = yield* ClinicalDomainHub

    const encounter = yield* hub.get('Encounter', encounterUrl)

    // Resolve location references
    const locationUrls = (encounter.location ?? []).map(
      (l: EncounterLocation) => l.location.asResourceUrl(Location)
    )
    const locations = yield* Effect.allSuccesses(
      locationUrls.map((urlEffect) =>
        Effect.flatMap(urlEffect, (url) => hub.get('Location', url))
      )
    )

    // Fetch questionnaire responses for this encounter
    const responses = yield* hub.search('QuestionnaireResponse', {
      encounter: encounterUrl.toString(),
    })
    const allQuestionnaires = yield* hub.search('Questionnaire')

    const questionnaireResponses = yield* Effect.all(
      responses.map((questionnaireResponse) =>
        Option.fromNullable<
          Resource.WithResourceUrl<Questionnaire> | undefined
        >(
          allQuestionnaires.find((q) =>
            Equal.equals(q.url, questionnaireResponse.questionnaire)
          )
        ).pipe(
          Option.map((questionnaire) =>
            Effect.succeed<FullEncounter['questionnaireResponses'][0]>({
              questionnaireResponse,
              questionnaire,
            })
          ),
          Option.getOrElse(() =>
            Effect.fail(
              new UnhandledError({
                message: `Questionnaire Response's Questionnaire '${questionnaireResponse.questionnaire}' could not be found`,
              })
            )
          )
        )
      )
    )

    return { encounter, locations, questionnaireResponses }
  })
