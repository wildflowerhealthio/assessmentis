'use client'

import { useEffect, useState, type SetStateAction } from 'react'
import {
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/QuestionnaireItemForm'
import { useRuntimeContext } from 'app/clientRuntime'
import { Effect } from 'effect'
import { hasId } from '@assessmentis/clinical-domain/general-purpose'

type IProps = {
  questionnaire: Questionnaire
  questionnaireResponse: QuestionnaireResponse
}

const QuestionnaireForm = ({
  questionnaire,
  questionnaireResponse: loadedQuestionnaireResponse,
}: IProps) => {
  const clientRuntime = useRuntimeContext()
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse>(loadedQuestionnaireResponse)

  useEffect(() => {
    const submitTimeout = setTimeout(() => {
      clientRuntime
        .runPromise(
          Effect.gen(function* () {
            const questionnaireResponseClient =
              yield* QuestionnaireResponseRepository
            if (!hasId(questionnaireResponse)) return
            return yield* questionnaireResponseClient.updateQuestionnaireResponse(
              questionnaireResponse
            )
          })
        )
        .then((res) => console.log({ res }))
        .catch((err) => console.error({ err }))
    }, 5000)
    return () => clearTimeout(submitTimeout)
  }, [questionnaireResponse, clientRuntime])

  return (
    <>
      {questionnaire.item?.map((item) => (
        <QuestionnaireItemForm
          key={item.linkId}
          questionnaireItem={item}
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
