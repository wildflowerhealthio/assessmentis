'use client'

import {
  getUiControlCode,
  QuestionnaireItemType,
  QuestionnaireItemUIControlCode,
  QuestionnaireResponseItem,
  QuestionnaireItem,
} from '@assessmentis/domain/questionnaires'
import DisplayQuestionnaireItemForm from 'app/modules/questionnaire/features/QuestionnaireForm/components/DisplayQuestionnaireItemForm/DisplayQuestionnaireItemForm'
import RadioQuestionnaireItemForm, {
  RadioQuestionnaireItemFormGroup,
} from 'app/modules/questionnaire/features/QuestionnaireForm/components/RadioQuestionnaireItemForm/RadioQuestionnaireItemForm'
import TextQuestionnaireItemForm from 'app/modules/questionnaire/features/QuestionnaireForm/components/TextQuestionnaireItemForm/TextQuestionnaireItemForm'
import type { SetStateAction } from 'react'

interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (
    update: SetStateAction<QuestionnaireResponseItem>
  ) => void
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const QuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  uiControl,
}: IProps) => {
  const questionText =
    getUiControlCode(questionnaireItem) == 'grid' ? (
      <p className="body-3" style={{ marginTop: 'var(--space-2)' }}>
        {questionnaireItem.text}
      </p>
    ) : undefined

  switch (questionnaireItem.type) {
    case QuestionnaireItemType.enums.boolean: {
      return (
        <>
          {questionText}
          <RadioQuestionnaireItemForm
            key={questionnaireItem.linkId}
            questionnaireItem={questionnaireItem}
            questionnaireResponseItem={questionnaireResponseItem}
            setQuestionnaireResponseItem={setQuestionnaireResponseItem}
            uiControl={uiControl}
          />
        </>
      )
    }
    case QuestionnaireItemType.enums.text: {
      return (
        <>
          {questionText}
          <TextQuestionnaireItemForm
            key={questionnaireItem.linkId}
            questionnaireItem={questionnaireItem}
            questionnaireResponseItem={questionnaireResponseItem}
            setQuestionnaireResponseItem={setQuestionnaireResponseItem}
            uiControl={uiControl}
          />
        </>
      )
    }
    case QuestionnaireItemType.enums.group: {
      const questionnaireItems = questionnaireItem.item ?? []
      const items = (
        <>
          {questionnaireItems.map((qi) => (
            <QuestionnaireItemForm
              key={qi.text}
              questionnaireItem={qi}
              questionnaireResponseItem={
                questionnaireResponseItem.item?.find(
                  ({ linkId }) => linkId == qi.linkId
                ) ?? { linkId: qi.linkId }
              }
              setQuestionnaireResponseItem={(
                update: SetStateAction<QuestionnaireResponseItem>
              ) =>
                setQuestionnaireResponseItem(
                  (
                    qri: QuestionnaireResponseItem
                  ): QuestionnaireResponseItem => ({
                    ...qri,
                    item: [
                      ...(qri.item?.filter(
                        ({ linkId }) => linkId != qi.linkId
                      ) ?? []),
                      typeof update == 'function'
                        ? update(
                            qri.item?.find(
                              ({ linkId }) => linkId == qi.linkId
                            ) ?? { linkId: qi.linkId }
                          )
                        : update,
                    ],
                  })
                )
              }
              uiControl={getUiControlCode(questionnaireItem)}
            />
          ))}
        </>
      )
      if (
        questionnaireItems.every(
          (item) => item.type == QuestionnaireItemType.enums.boolean
        ) &&
        getUiControlCode(questionnaireItem) == 'table'
      ) {
        return (
          <RadioQuestionnaireItemFormGroup
            key={questionnaireItem.linkId}
            answerOption={[
              { initialSelected: true },
              { initialSelected: false },
            ]}
          >
            {items}
          </RadioQuestionnaireItemFormGroup>
        )
      }
      return items
    }
    case QuestionnaireItemType.enums.display:
      return (
        <DisplayQuestionnaireItemForm
          key={questionnaireItem.linkId}
          questionnaireItem={questionnaireItem}
          uiControl={uiControl}
        />
      )
  }
  throw new Error('Unknown item type')
}

export default QuestionnaireItemForm
