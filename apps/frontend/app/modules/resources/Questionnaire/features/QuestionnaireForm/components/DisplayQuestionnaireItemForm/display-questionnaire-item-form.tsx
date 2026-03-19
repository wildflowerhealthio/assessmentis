import { QuestionnaireItemUiDisplayLevel, getUiDisplayLevel } from '@assessmentis/clinical-domain'
import type {
  QuestionnaireItem,
  QuestionnaireItemUIControlCode,
} from '@assessmentis/clinical-domain'
import { cn } from '@assessmentis/react-util'

import classes from './DisplayQuestionnaireItemForm.module.css'

export interface IProps {
  questionnaireItem: QuestionnaireItem
  uiControl: typeof QuestionnaireItemUIControlCode.Type | undefined
}

const DisplayQuestionnaireItemForm = ({ questionnaireItem }: IProps) => {
  switch (getUiDisplayLevel(questionnaireItem)) {
    case QuestionnaireItemUiDisplayLevel.enums.heading1: {
      return (
        <h3 className={cn('heading-4', classes.DisplayQuestionnaireItemForm)}>
          {questionnaireItem.text}
        </h3>
      )
    }
    case QuestionnaireItemUiDisplayLevel.enums.heading2: {
      return (
        <h4 className={cn('heading-3', classes.DisplayQuestionnaireItemForm)}>
          {questionnaireItem.text}
        </h4>
      )
    }
    case QuestionnaireItemUiDisplayLevel.enums.heading3: {
      return (
        <h5 className={cn('heading-2', classes.DisplayQuestionnaireItemForm)}>
          {questionnaireItem.text}
        </h5>
      )
    }
    default: {
      return <p className="body-4">{questionnaireItem.text}</p>
    }
  }
}

export default DisplayQuestionnaireItemForm
