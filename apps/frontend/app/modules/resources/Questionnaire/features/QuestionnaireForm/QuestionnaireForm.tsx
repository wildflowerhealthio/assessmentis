import { useState, type SetStateAction } from 'react'
import {
  Questionnaire,
  QuestionnaireItemLink,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/QuestionnaireItemForm'
import { Effect } from 'effect'
import { hasId } from '@assessmentis/clinical-domain/data-types'
import { useAutoSave } from 'app/modules/common/hooks/useAutoSave'
import { usePlatformContext } from '../../../../../layers/PlatformContext'

type IProps = {
  questionnaire: Questionnaire
  questionnaireResponse: QuestionnaireResponse
  highlightLinks?: Set<QuestionnaireItemLink>
}

const QuestionnaireForm = ({
  questionnaire,
  questionnaireResponse: loadedQuestionnaireResponse,
  highlightLinks,
}: IProps) => {
  const { clinicalDataRepositoryService } = usePlatformContext()
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse>(loadedQuestionnaireResponse)

  // Use auto-save hook for questionnaire responses
  useAutoSave({
    data: questionnaireResponse,
    onSave: async (data) => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const questionnaireResponseClient =
            yield* QuestionnaireResponseRepository
          if (!hasId(data)) return
          return yield* questionnaireResponseClient.update(data)
        }).pipe(
          Effect.provideServiceEffect(
            QuestionnaireResponseRepository,
            clinicalDataRepositoryService.QuestionnaireResponse
          )
        )
      )
    },
    delay: 5000,
  })

  return (
    <>
      {questionnaire.item?.map((item) => (
        <QuestionnaireItemForm
          key={item.linkId}
          questionnaireItem={item}
          highlightLinks={highlightLinks ?? new Set<QuestionnaireItemLink>()}
          questionnaireResponseItem={
            questionnaireResponse.item?.find(
              ({ linkId }) => linkId == item.linkId
            ) ?? { linkId: item.linkId }
          }
          setQuestionnaireResponseItem={(
            update: SetStateAction<QuestionnaireResponseItem>
          ) =>
            setQuestionnaireResponse((qr) => ({
              ...qr,
              item: [
                ...(qr.item?.filter(({ linkId }) => linkId != item.linkId) ??
                  []),
                typeof update == 'function'
                  ? update(
                      qr.item?.find(({ linkId }) => linkId == item.linkId) ?? {
                        linkId: item.linkId,
                      }
                    )
                  : update,
              ],
            }))
          }
          uiControl={undefined}
        />
      ))}
    </>
  )
}
export default QuestionnaireForm
