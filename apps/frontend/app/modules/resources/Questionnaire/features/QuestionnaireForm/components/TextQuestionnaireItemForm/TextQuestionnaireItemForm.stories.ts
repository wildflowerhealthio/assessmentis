// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Arbitrary, FastCheck } from 'effect'
import { action } from 'storybook/actions'
import { Code } from '@assessmentis/clinical-domain/data-types'
import {
  QuestionnaireItem,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain'
import TextQuestionnaireItemForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/components/TextQuestionnaireItemForm/TextQuestionnaireItemForm'

//👇 This default export determines where your story goes in the story list
const meta = {
  component: TextQuestionnaireItemForm,
} satisfies Meta<typeof TextQuestionnaireItemForm>

export default meta
type Story = StoryObj<typeof meta>

const questionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

const arbitraryProps = {
  questionnaireItem: QuestionnaireItem.make({
    ...questionnaireItem,
    type: 'text',
    text: 'Do you often interrupt the activities of others, or intrude on others?',
  }),
  questionnaireResponseItem: QuestionnaireResponseItem.make({
    linkId: questionnaireItem.linkId,
    answer: [
      QuestionnaireResponseItemAnswer.make({ valueString: 'some text' }),
    ],
  }),
  setQuestionnaireResponseItem: action('setQuestionnaireResponseItem'),
  uiControl: undefined,
}

export const RegularQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: QuestionnaireItem.make({
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    }),
  },
}

export const WithinQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
    },
    uiControl: Code.make('table'),
  },
}

export const RegularQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    },
    area: true,
  },
}

export const WithinQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    },
    area: true,
  },
}
