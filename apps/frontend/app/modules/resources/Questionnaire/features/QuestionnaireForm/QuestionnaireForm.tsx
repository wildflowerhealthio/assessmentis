import { useState, type SetStateAction } from 'react'
import {
  Questionnaire,
  QuestionnaireItemLink,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/QuestionnaireItemForm'
import { useRuntime } from 'app/clientRuntime'
import { Effect } from 'effect'
import { hasId } from '@assessmentis/clinical-domain/data-types'
import { useAutoSave } from 'app/modules/common/hooks/useAutoSave'

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
  const effectRuntime = useRuntime()
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse>(loadedQuestionnaireResponse)

  // Use auto-save hook for questionnaire responses
  useAutoSave({
    data: questionnaireResponse,
    onSave: async (data) => {
      await effectRuntime.runPromise(
        Effect.gen(function* () {
          const questionnaireResponseClient =
            yield* QuestionnaireResponseRepository
          if (!hasId(data)) return
          return yield* questionnaireResponseClient.update(data)
        })
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
