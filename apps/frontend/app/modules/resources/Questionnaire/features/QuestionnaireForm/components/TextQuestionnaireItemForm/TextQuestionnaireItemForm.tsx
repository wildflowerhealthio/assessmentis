'use client'

import { DateTime, Effect } from 'effect'
import { type ChangeEventHandler, type SetStateAction } from 'react'

import {
  QuestionnaireItemAnsweredAtExtension,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  type QuestionnaireItem,
  type QuestionnaireItemUIControlCode,
} from '@assessmentis/clinical-domain'
import { cn } from '@assessmentis/react-util'

import classes from './TextQuestionnaireItemForm.module.css'

export interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (
    update: SetStateAction<QuestionnaireResponseItem>
  ) => void
  area?: boolean
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const TextQuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  area,
}: IProps) => {
  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (
    ev
  ) => {
    const valueString = ev.currentTarget.value
    setQuestionnaireResponseItem(
      (qri: QuestionnaireResponseItem): QuestionnaireResponseItem =>
        QuestionnaireResponseItem.make({
          ...qri,
          answer: [
            QuestionnaireResponseItemAnswer.make({
              valueString,
              modifierExtension: [
                QuestionnaireItemAnsweredAtExtension.make({
                  valueDateTime: Effect.runSync(DateTime.now),
                }),
              ],
            }),
          ],
        })
    )
  }

  const valueElement = questionnaireResponseItem.answer?.[0]
  const valueString =
    valueElement && 'valueString' in valueElement
      ? valueElement.valueString
      : ''

  return (
    <label className={cn('label-3', classes.TextQuestionnaireItem__label)}>
      {questionnaireItem.text}
      {area ? (
        <textarea
          className="input-2"
          name="textQuestionnaireResponseValue"
          rows={4}
          // onBlur={() => {
          //   if (answer) handleSubmit(answer);
          // }}
          value={valueString}
          onChange={onChange}
        ></textarea>
      ) : (
        <input
          className="input-2"
          name="textQuestionnaireResponseValue"
          // onBlur={() => {
          //   if (answer) handleSubmit(answer);
          // }}
          value={valueString}
          onChange={onChange}
        ></input>
      )}
    </label>
  )
}

export default TextQuestionnaireItemForm
