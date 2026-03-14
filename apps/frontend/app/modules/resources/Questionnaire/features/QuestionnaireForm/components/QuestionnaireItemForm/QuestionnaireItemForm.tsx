'use client'

import type { SetStateAction } from 'react'

import {
  getUiControlCode,
  QuestionnaireItemAnswerOption,
  QuestionnaireItemType,
  QuestionnaireResponseItem,
  type QuestionnaireItem,
  type QuestionnaireItemLink,
  type QuestionnaireItemUIControlCode,
} from '@assessmentis/clinical-domain'

import DisplayQuestionnaireItemForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/components/DisplayQuestionnaireItemForm/DisplayQuestionnaireItemForm'
import RadioQuestionnaireItemForm, {
  RadioQuestionnaireItemFormGroup,
} from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/components/RadioQuestionnaireItemForm/RadioQuestionnaireItemForm'
import TextQuestionnaireItemForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/components/TextQuestionnaireItemForm/TextQuestionnaireItemForm'
import { updateResponseItem } from '../../updateResponseItem'

interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (
    update: SetStateAction<QuestionnaireResponseItem>
  ) => void
  highlightLinks: Set<QuestionnaireItemLink>
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const QuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  highlightLinks,
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
        <div
          style={
            highlightLinks.has(questionnaireItem.linkId)
              ? { border: '2px solid yellow' }
              : {}
          }
        >
          {questionText}
          <RadioQuestionnaireItemForm
            key={questionnaireItem.linkId}
            questionnaireItem={questionnaireItem}
            questionnaireResponseItem={questionnaireResponseItem}
            setQuestionnaireResponseItem={setQuestionnaireResponseItem}
            uiControl={uiControl}
          />
        </div>
      )
    }
    case QuestionnaireItemType.enums.text: {
      return (
        <div
          style={
            highlightLinks.has(questionnaireItem.linkId)
              ? { border: '2px solid yellow' }
              : {}
          }
        >
          {questionText}
          <TextQuestionnaireItemForm
            key={questionnaireItem.linkId}
            questionnaireItem={questionnaireItem}
            questionnaireResponseItem={questionnaireResponseItem}
            setQuestionnaireResponseItem={setQuestionnaireResponseItem}
            uiControl={uiControl}
          />
        </div>
      )
    }
    case QuestionnaireItemType.enums.group: {
      const questionnaireItems = questionnaireItem.item ?? []
      const items = (
        <>
          {questionnaireItems.map((qi) => (
            <QuestionnaireItemForm
              key={qi.text}
              highlightLinks={highlightLinks}
              questionnaireItem={qi}
              questionnaireResponseItem={
                questionnaireResponseItem.item?.find(
                  ({ linkId }) => linkId == qi.linkId
                ) ?? QuestionnaireResponseItem.make({ linkId: qi.linkId })
              }
              setQuestionnaireResponseItem={(
                update: SetStateAction<QuestionnaireResponseItem>
              ) =>
                setQuestionnaireResponseItem(
                  updateResponseItem(qi.linkId, update)
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
              QuestionnaireItemAnswerOption.make({
                value: { _tag: 'boolean', boolean: true },
              }),
              QuestionnaireItemAnswerOption.make({
                value: { _tag: 'boolean', boolean: false },
              }),
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
    case QuestionnaireItemType.enums.choice: {
      return (
        <div
          style={
            highlightLinks.has(questionnaireItem.linkId)
              ? { border: '2px solid yellow' }
              : {}
          }
        >
          {questionText}
          <RadioQuestionnaireItemForm
            key={questionnaireItem.linkId}
            questionnaireItem={questionnaireItem}
            questionnaireResponseItem={questionnaireResponseItem}
            setQuestionnaireResponseItem={setQuestionnaireResponseItem}
            uiControl={uiControl}
          />
        </div>
      )
    }
  }
  throw new Error(`Unknown item type ${questionnaireItem.type}`)
}

export default QuestionnaireItemForm
