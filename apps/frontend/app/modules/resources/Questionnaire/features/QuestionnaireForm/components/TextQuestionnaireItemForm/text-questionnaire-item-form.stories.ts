// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Arbitrary, FastCheck } from 'effect'

import {
  QuestionnaireItem,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain'
import { Code } from '@assessmentis/clinical-domain/data-types'

import { action } from 'storybook/actions'
import TextQuestionnaireItemForm from '@/modules/resources/Questionnaire/features/QuestionnaireForm/components/TextQuestionnaireItemForm/text-questionnaire-item-form'

//👇 This default export determines where your story goes in the story list
const meta = {
  component: TextQuestionnaireItemForm,
} satisfies Meta<typeof TextQuestionnaireItemForm>

export default meta
type Story = StoryObj<typeof meta>

const questionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

const arbitraryProps = {
  questionnaireItem: questionnaireItem.cloneWith({
    text: 'Do you often interrupt the activities of others, or intrude on others?',
    type: 'text',
  }),
  questionnaireResponseItem: QuestionnaireResponseItem.make({
    answer: [
      QuestionnaireResponseItemAnswer.make({
        value: { _tag: 'string', string: 'some text' },
      }),
    ],
    linkId: questionnaireItem.linkId,
  }),
  setQuestionnaireResponseItem: action('setQuestionnaireResponseItem'),
  uiControl: undefined,
}

const RegularQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // oxfmt-ignore
      // style: QuestionnaireItemStyle.QUESTION,
    }),
  },
}

const WithinQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem,
    uiControl: Code.make('table'),
  },
}

const RegularQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    area: true,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // style: QuestionnaireItemStyle.QUESTION,
    }),
  },
}

const WithinQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    area: true,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    }),
  },
}

export { RegularQuestion, WithinQuestion, RegularQuestionArea, WithinQuestionArea }
