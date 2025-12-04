import { Data, DateTime, Equal, Match } from 'effect'
import { type ChangeEventHandler, type SetStateAction } from 'react'
import classes from './RadioQuestionnaireItemForm.module.css'
import {
  QuestionnaireItem,
  QuestionnaireItemUIControlCode,
  QuestionnaireResponseItem,
  withAnsweredAt,
} from '@assessmentis/domain/questionnaires'
import { type ValueElement } from '@assessmentis/domain/general-purpose'
import { cn } from '@assessmentis/react-util'
import { useRuntimeContext } from 'app/clientRuntime'

export interface IProps {
  questionnaireItem: QuestionnaireItem
  questionnaireResponseItem: QuestionnaireResponseItem
  setQuestionnaireResponseItem: (
    update: SetStateAction<QuestionnaireResponseItem>
  ) => void
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const labelFor = (option: ValueElement) =>
  Match.value(option).pipe(
    Match.when({ initialSelected: Match.boolean }, ({ initialSelected }) =>
      initialSelected ? 'Yes' : 'No'
    ),
    Match.when({ valueString: Match.string }, ({ valueString }) => valueString),
    Match.when(
      { valueCoding: { display: Match.string } },
      ({ valueCoding }) => valueCoding.display
    ),
    Match.orElse(() => '')
  )

const RadioQuestionnaireItemForm = ({
  questionnaireItem,
  questionnaireResponseItem,
  setQuestionnaireResponseItem,
  uiControl,
}: IProps) => {
  const clientRuntime = useRuntimeContext()

  const displayAsGrid = uiControl === QuestionnaireItemUIControlCode.enums.table

  const answerOptions: undefined | ValueElement[] =
    questionnaireItem.answerOption
  const options =
    answerOptions?.map((answerValue) => ({
      label: labelFor(answerValue),
      answerValue,
    })) ??
    (questionnaireItem.type == 'boolean'
      ? [
          { label: 'Yes', answerValue: { valueBoolean: true } },
          { label: 'No', answerValue: { valueBoolean: false } },
        ]
      : [])

  const onChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const selected = options.find(
      (opt) => opt.label == ev.currentTarget.value
    )?.answerValue
    if (!selected) throw new Error("Selected option doesn't match any label")

    setQuestionnaireResponseItem(
      (qri: QuestionnaireResponseItem): QuestionnaireResponseItem => ({
        ...qri,
        answer: [
          withAnsweredAt(
            { ...selected, modifierExtension: [] },
            clientRuntime.runSync(DateTime.now)
          ),
        ],
      })
    )
  }

  const answerValue = questionnaireResponseItem.answer?.[0] ?? {}

  const { modifierExtension: _, ...valueElement } = answerValue
  return (
    <fieldset
      key={questionnaireItem.linkId}
      name="RadioQuestionnaireItemForm"
      className={cn(classes.RadioQuestionnaireItemForm, {
        [classes['RadioQuestionnaireItemForm--grid']]: displayAsGrid ?? false,
      })}
    >
      <legend
        key="legend"
        className={cn('label-2', classes.RadioQuestionnaireItemForm__legend)}
      >
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
            checked={
              valueElement != undefined &&
              Equal.equals(Data.struct(valueElement), Data.struct(answerValue))
            }
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
  answerOption: ValueElement[]
}>) => {
  return (
    <div>
      <div
        style={{ width: '100%' }}
        className={cn(
          classes.RadioQuestionnaireItemForm,
          classes['RadioQuestionnaireItemForm--grid']
        )}
      >
        <legend
          className={cn('label-2', classes.RadioQuestionnaireItemForm__legend)}
        ></legend>
        {answerOption.map((ao) => {
          const labelText = labelFor(ao)
          return (
            <label
              key={labelText}
              className={cn(
                'label-3',
                classes.RadioQuestionnaireItemForm__label
              )}
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
}

export default RadioQuestionnaireItemForm
