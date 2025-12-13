'use client'

import { type DetailedHTMLProps, type SelectHTMLAttributes } from 'react'
import { Questionnaire } from '@assessmentis/clinical-domain/questionnaires'

interface IProps extends DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> {
  questionnaires: ReadonlyArray<Questionnaire>
}

const QuestionnaireSelect = ({ questionnaires, ...selectProps }: IProps) => {
  return (
    <select {...selectProps}>
      <option key={''} value={undefined}>
        -
      </option>
      {questionnaires.map((q) => (
        <option key={q.id} value={q.id}>
          {q.title} {q.meta?.lastUpdated}
        </option>
      ))}
    </select>
  )
}

export default QuestionnaireSelect
