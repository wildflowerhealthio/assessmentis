'use client'

import { DateTime, Effect } from 'effect'
import type { ChangeEventHandler, SetStateAction } from 'react'

import {
  QuestionnaireItemAnsweredAtExtension,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain'
import type {
  QuestionnaireItem,
  QuestionnaireItemUIControlCode,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain'
import { cn } from '@assessmentis/react-util'

import classes from './TextQuestionnaireItemForm.module.css'

export interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (update: SetStateAction<QuestionnaireResponseItem>) => void
  area?: boolean
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const TextQuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  area,
}: IProps): React.JSX.Element => {
  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (ev) => {
    const valueString = ev.currentTarget.value
    setQuestionnaireResponseItem(
      (qri: QuestionnaireResponseItem): QuestionnaireResponseItem =>
        qri.cloneWith({
          answer: [
            QuestionnaireResponseItemAnswer.make({
              modifierExtension: [
                QuestionnaireItemAnsweredAtExtension.make({
                  valueDateTime: Effect.runSync(DateTime.now),
                }),
              ],
              value: { _tag: 'string', string: valueString },
            }),
          ],
        })
    )
  }

  const answerValue = questionnaireResponseItem.answer?.[0]?.value
  const valueString = answerValue?._tag === 'string' ? answerValue.string : ''

  return (
    <label className={cn('label-3', classes.TextQuestionnaireItem__label)}>
      {questionnaireItem.text}
      {area ? (
        <textarea
          className="input-2"
          name="textQuestionnaireResponseValue"
          rows={4}
          // OnBlur={() => {
          //   If (answer) handleSubmit(answer);
          // }}
          value={valueString}
          onChange={onChange}
        />
      ) : (
        <input
          className="input-2"
          name="textQuestionnaireResponseValue"
          // OnBlur={() => {
          //   If (answer) handleSubmit(answer);
          // }}
          value={valueString}
          onChange={onChange}
        />
      )}
    </label>
  )
}

export default TextQuestionnaireItemForm
