import { Effect } from 'effect'
import type {
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import {
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/repositories'
import type { Route } from './+types/QuestionnaireResponse._index'
import { QuestionnaireResponseListItem } from '../modules/resources/Questionnaire/components/QuestionnaireResponseListItem/QuestionnaireResponseListItem'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import {
  type ExternalAssertionError,
  type UnhandledError,
  type AuthError,
  type AuthzError,
  NotFoundError,
} from '@assessmentis/ontology'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { createResourceCollectionHook } from '../modules/common/utils/createResourceCollectionHook'

const _getQuestionnaireResponses = (): Effect.Effect<
  {
    questionnaireResponse: QuestionnaireResponse
    questionnaire: Questionnaire | undefined
  }[],
  UnhandledError | ExternalAssertionError | AuthError | AuthzError,
  QuestionnaireRepository | QuestionnaireResponseRepository
> => {
  return Effect.gen(function* () {
    const questionnaireRepository = yield* QuestionnaireRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const responses = yield* questionnaireResponseRepository.getMany()
    return yield* Effect.all(
      responses.map(
        (
          r
        ): Effect.Effect<
          {
            questionnaireResponse: QuestionnaireResponse
            questionnaire: Questionnaire | undefined
          },
          UnhandledError | ExternalAssertionError | AuthError | AuthzError,
          never
        > =>
          Effect.map(
            r.questionnaire
              ? questionnaireRepository
                  .get(r.questionnaire)
                  .pipe(
                    Effect.catchTag(NotFoundError._tag, (_err) =>
                      Effect.succeed(undefined)
                    )
                  )
              : Effect.succeed(undefined),
            (questionnaire) => ({
              questionnaireResponse: r,
              questionnaire,
            })
          )
      )
    )
  })
}

const useQuestionnaireResponse =
  createResourceCollectionHook<QuestionnaireResponse>({
    resourceType: 'QuestionnaireResponse',
  })

export default function QuestionnaireResponsePage(_: Route.ComponentProps) {
  const { collectionPromise, deleteItem: deleteQuestionnaireResponse } =
    useQuestionnaireResponse()
  useBreadcrumbs([{ label: 'Questionnaire Responses' }])

  return (
    <ResourceListPage
      title="Questionnaire Responses"
      collectionPromise={collectionPromise}
      createPath=""
      createLabel="Create Questionnaire Response"
      onDelete={(url) => deleteQuestionnaireResponse(url?.toString())}
      ItemComponent={QuestionnaireResponseListItem}
    />
  )
}
