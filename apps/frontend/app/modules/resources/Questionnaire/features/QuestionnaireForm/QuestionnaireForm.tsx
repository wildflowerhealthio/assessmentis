import { Effect } from 'effect'
import { useState } from 'react'
import type { SetStateAction } from 'react'

import {
  QuestionnaireResponseItem,
  QuestionnaireResponse,
  ClinicalDomainHub,
} from '@assessmentis/clinical-domain'
import type {
  Questionnaire,
  QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'

import { useAutoSave } from 'app/modules/common/hooks/useAutoSave'

import { useHub } from '../../../../../layers/useHub'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/QuestionnaireItemForm'
import { updateResponseItem } from './updateResponseItem'

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
  const hub = useHub()
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse>(loadedQuestionnaireResponse)

  // Use auto-save hook for questionnaire responses
  useAutoSave({
    data: questionnaireResponse,
    onSave: async (data) => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const h = yield* ClinicalDomainHub
          if (!data || !Resource.hasResourceUrl(data)) return
          return yield* h.update(QuestionnaireResponse, data)
        }).pipe(Effect.provideService(ClinicalDomainHub, hub))
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
            ) ?? QuestionnaireResponseItem.make({ linkId: item.linkId })
          }
          setQuestionnaireResponseItem={(
            update: SetStateAction<QuestionnaireResponseItem>
          ) =>
            setQuestionnaireResponse(updateResponseItem(item.linkId, update))
          }
          uiControl={undefined}
        />
      ))}
    </>
  )
}
export default QuestionnaireForm
