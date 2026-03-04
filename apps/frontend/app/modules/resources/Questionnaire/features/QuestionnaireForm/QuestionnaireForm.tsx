import { Effect } from 'effect'
import { useState, type SetStateAction } from 'react'

import {
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  type Questionnaire,
  type QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'
import { QuestionnaireResponseRepository } from '@assessmentis/clinical-domain/repositories'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { useAutoSave } from 'app/modules/common/hooks/useAutoSave'

import { usePlatformContext } from '../../../../../layers/PlatformContext'
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
          if (!data || !hasUrl(data)) return
          return yield* questionnaireResponseClient.update(data)
        }).pipe(
          Effect.provideServiceEffect(
            QuestionnaireResponseRepository,
            clinicalDataRepositoryService.effect.QuestionnaireResponse
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
