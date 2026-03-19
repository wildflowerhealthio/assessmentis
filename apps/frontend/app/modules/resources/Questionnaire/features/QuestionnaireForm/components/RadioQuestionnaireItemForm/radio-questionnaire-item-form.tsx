import { Data, DateTime, Effect, Equal } from 'effect'
import type { ChangeEventHandler, SetStateAction } from 'react'

import {
  QuestionnaireItemAnswerOption,
  QuestionnaireItemAnsweredAtExtension,
  QuestionnaireItemUIControlCode,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain'
import type {
  QuestionnaireItem,
  QuestionnaireItemAnswerOption as QuestionnaireItemAnswerOptionType,
} from '@assessmentis/clinical-domain'
import { Coding, DatatypeChoice } from '@assessmentis/clinical-domain/data-types'
import { cn } from '@assessmentis/react-util'

import classes from './RadioQuestionnaireItemForm.module.css'

export interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (update: SetStateAction<QuestionnaireResponseItem>) => void
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const labelFor = (option: QuestionnaireItemAnswerOptionType): string => {
  const v = option.value
  if (!v) {
    return option.initialSelected === undefined ? '' : option.initialSelected ? 'Yes' : 'No'
  }
  return DatatypeChoice.match(
    v,
    {
      Coding: (_) => Coding.Datatype.from(v)?.display ?? '',
      boolean: (b) => (b ? 'Yes' : 'No'),
      string: (s) => s,
    },
    () => ''
  )
}

const RadioQuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  uiControl,
}: IProps): React.JSX.Element => {
  const displayAsGrid = uiControl === QuestionnaireItemUIControlCode.enums.table

  const answerOptions: undefined | readonly QuestionnaireItemAnswerOptionType[] =
    questionnaireItem.answerOption
  const options =
    answerOptions?.map((answerValue) => ({
      answerValue,
      label: labelFor(answerValue),
    })) ??
    (questionnaireItem.type === 'boolean'
      ? [
          {
            answerValue: QuestionnaireItemAnswerOption.make({
              value: { _tag: 'boolean', boolean: true },
            }),
            label: 'Yes',
          },
          {
            answerValue: QuestionnaireItemAnswerOption.make({
              value: { _tag: 'boolean', boolean: false },
            }),
            label: 'No',
          },
        ]
      : [])

  const onChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const selected = options.find((opt) => opt.label === ev.currentTarget.value)?.answerValue
    if (!selected) {
      throw new Error("Selected option doesn't match any label")
    }

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
              value: selected.value,
            }),
          ],
        })
    )
  }

  const currentAnswer = questionnaireResponseItem.answer?.[0]
  const currentValue = currentAnswer?.value

  const isSelectedAnswer = (
    current: (Record<string, unknown> & { _tag: string }) | undefined,
    optionValue: (Record<string, unknown> & { _tag: string }) | undefined
  ): boolean => {
    if (!current || !optionValue) {
      return false
    }
    if (current._tag !== optionValue._tag) {
      return false
    }

    if (current._tag === 'Coding' && optionValue._tag === 'Coding') {
      // Coding is PermissivePassthrough (unknown) in DatatypeChoice
      const curCoding = Coding.Datatype.from(current)
      const optCoding = Coding.Datatype.from(optionValue)
      return curCoding?.code === optCoding?.code
    }

    return Equal.equals(Data.struct(current), Data.struct(optionValue))
  }

  return (
    <fieldset
      key={questionnaireItem.linkId}
      name="RadioQuestionnaireItemForm"
      className={cn(classes.RadioQuestionnaireItemForm, {
        [classes['RadioQuestionnaireItemForm--grid']]: displayAsGrid ?? false,
      })}
    >
      <legend key="legend" className={cn('label-2', classes.RadioQuestionnaireItemForm__legend)}>
        {questionnaireItem.text}
      </legend>

      {options.map(({ label, answerValue }) => (
        <label
          key={label}
          className={cn('label-3', classes.RadioQuestionnaireItemForm__label)}
          htmlFor={label}
        >
          <input
            type="radio"
            value={label}
            className="radio-3 blue"
            checked={isSelectedAnswer(currentValue, answerValue.value)}
            onChange={onChange}
          />
          {displayAsGrid ? null : label}
        </label>
      ))}
    </fieldset>
  )
}
export const RadioQuestionnaireItemFormGroup = ({
  children,
  answerOption,
}: React.PropsWithChildren<{
  answerOption: readonly QuestionnaireItemAnswerOption[]
}>): React.JSX.Element => (
  <div>
    <div
      style={{ width: '100%' }}
      className={cn(
        classes.RadioQuestionnaireItemForm,
        classes['RadioQuestionnaireItemForm--grid']
      )}
    >
      <legend className={cn('label-2', classes.RadioQuestionnaireItemForm__legend)} />
      {answerOption.map((ao) => {
        const labelText = labelFor(ao)
        return (
          <label
            key={labelText}
            className={cn('label-3', classes.RadioQuestionnaireItemForm__label)}
            style={{ textAlign: 'center', display: 'block' }}
          >
            {labelText}
          </label>
        )
      })}
    </div>
    {children}
  </div>
)

export default RadioQuestionnaireItemForm
