import { Effect } from 'effect'
import { useState, type SetStateAction } from 'react'

import {
  ClinicalDomainHub,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  type Questionnaire,
  type QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { useAutoSave } from 'app/modules/common/hooks/useAutoSave'

import { useHub } from '../../../../../layers/useHub'
import QuestionnaireItemForm from './components/QuestionnaireItemForm/QuestionnaireItemForm'

const hasUrl = <T extends { readonly url?: ReadonlyUrl | undefined }>(
  resource: T
): resource is T & { readonly url: NonNullable<T['url']> } =>
  resource.url !== undefined

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
          if (!data || !hasUrl(data)) return
          return yield* h.update('QuestionnaireResponse', data)
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
            setQuestionnaireResponse((qr) =>
              QuestionnaireResponse.make({
                ...qr,
                item: [
                  ...(qr.item?.filter(({ linkId }) => linkId != item.linkId) ??
                    []),
                  typeof update == 'function'
                    ? QuestionnaireResponseItem.make(
                        update(
                          qr.item?.find(
                            ({ linkId }) => linkId == item.linkId
                          ) ??
                            QuestionnaireResponseItem.make({
                              linkId: item.linkId,
                            })
                        )
                      )
                    : QuestionnaireResponseItem.make(update),
                ],
              })
            )
          }
          uiControl={undefined}
        />
      ))}
    </>
  )
}
export default QuestionnaireForm
