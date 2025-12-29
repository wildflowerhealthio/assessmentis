import { Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  QuestionnaireResponseId,
} from '@assessmentis/clinical-domain/content-management'
import { useResourceRunEffect } from 'app/clientRuntime'
import type { Route } from './+types/_resource.QuestionnaireResponse._index'
import { QuestionnaireResponseListItem } from '../modules/resources/Questionnaire/components/QuestionnaireResponseListItem/QuestionnaireResponseListItem'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { useMemo } from 'react'

const _getQuestionnaireResponses = (): Effect.Effect<
  (QuestionnaireResponse & { _questionnaire: Questionnaire | undefined })[],
  UnhandledError | ExternalAssertionError | NeedsAuthenticationError,
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

const useQuestionnaireResponse = () => {
  const questionnaireResponses = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const questionnaireResponseRepository =
          yield* QuestionnaireResponseRepository
        return yield* questionnaireResponseRepository.getMany()
      })
    }, [])
  )
  return useClinicalDataCollection<
    QuestionnaireResponseId,
    QuestionnaireResponse,
    QuestionnaireResponseRepository,
    typeof QuestionnaireResponseRepository,
    never
  >(QuestionnaireResponseRepository, questionnaireResponses)
}

export default function QuestionnaireResponsePage(_: Route.ComponentProps) {
  const {
    collection: questionnaireResponses,
    deleteItem: deleteQuestionnaireResponse,
  } = useQuestionnaireResponse()

  return (
    <ResourceListPage
      title="Questionnaire Responses"
      collection={questionnaireResponses}
      createPath=""
      createLabel="Create Questionnaire Response"
      onDelete={deleteQuestionnaireResponse}
      ItemComponent={QuestionnaireResponseListItem}
    />
  )
}
