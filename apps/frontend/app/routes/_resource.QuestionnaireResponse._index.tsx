import { Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import type { Route } from './+types/_resource.QuestionnaireResponse._index'
import { QuestionnaireResponseListItem } from '../modules/resources/Questionnaire/components/QuestionnaireResponseListItem/QuestionnaireResponseListItem'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import {
  ExternalAssertionError,
  UnhandledError,
  AuthError,
  AuthzError,
} from '@assessmentis/ontology'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { createResourceCollectionHook } from '../modules/common/utils/createResourceCollectionHook'

const _getQuestionnaireResponses = (): Effect.Effect<
  (QuestionnaireResponse & { _questionnaire: Questionnaire | undefined })[],
  UnhandledError | ExternalAssertionError | AuthError | AuthzError,
  QuestionnaireRepository | QuestionnaireResponseRepository
> => {
  return Effect.gen(function* () {
    const questionnaireRepository = yield* QuestionnaireRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const [questionnaires, responses] = yield* Effect.all([
      questionnaireRepository.getMany(),
      questionnaireResponseRepository.getMany(),
    ])
    return responses.map(
      (
        r
      ): QuestionnaireResponse & {
        _questionnaire: Questionnaire | undefined
      } => ({
        ...r,
        _questionnaire:
          questionnaires.find((q) => q.id == r.questionnaire) ?? undefined,
      })
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
      onDelete={deleteQuestionnaireResponse}
      ItemComponent={QuestionnaireResponseListItem}
    />
  )
}
