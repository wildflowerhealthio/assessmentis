import { Effect } from 'effect'
import { useState } from 'react'
import type { SetStateAction } from 'react'

import {
  ClinicalDomainHub,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain'
import type { Questionnaire, QuestionnaireItemLink } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'

import { useAutoSave } from '@/modules/common/hooks/use-auto-save'

import { useHub } from '../../../../../layers/use-hub'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/questionnaire-item-form'
import { updateResponseItem } from './update-response-item'

interface IProps {
  questionnaire: Questionnaire
  questionnaireResponse: QuestionnaireResponse
  highlightLinks?: Set<QuestionnaireItemLink>
}

const QuestionnaireForm = ({
  questionnaire,
  questionnaireResponse: loadedQuestionnaireResponse,
  highlightLinks,
}: IProps): React.JSX.Element[] | undefined => {
  const hub = useHub()
  const [questionnaireResponse, setQuestionnaireResponse] = useState<QuestionnaireResponse>(
    loadedQuestionnaireResponse
  )

  // Use auto-save hook for questionnaire responses
  useAutoSave({
    data: questionnaireResponse,
    delay: 5000,
    onSave: async (data) => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const h = yield* ClinicalDomainHub
          if (!data || !Resource.hasResourceUrl(data)) {
            return
          }
          return yield* h.update(QuestionnaireResponse, data)
        }).pipe(Effect.provideService(ClinicalDomainHub, hub))
      )
    },
  })

  return questionnaire.item?.map((item) => (
    <QuestionnaireItemForm
      key={item.linkId}
      questionnaireItem={item}
      highlightLinks={highlightLinks ?? new Set<QuestionnaireItemLink>()}
      questionnaireResponseItem={
        questionnaireResponse.item?.find(({ linkId }) => linkId === item.linkId) ??
        QuestionnaireResponseItem.make({ linkId: item.linkId })
      }
      setQuestionnaireResponseItem={(update: SetStateAction<QuestionnaireResponseItem>) => {
        setQuestionnaireResponse(updateResponseItem(item.linkId, update))
      }}
      uiControl={undefined}
    />
  ))
}
export default QuestionnaireForm
