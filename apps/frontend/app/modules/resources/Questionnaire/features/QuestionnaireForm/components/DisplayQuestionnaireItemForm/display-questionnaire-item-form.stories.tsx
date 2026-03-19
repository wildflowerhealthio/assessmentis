// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Arbitrary, FastCheck } from 'effect'

import { QuestionnaireItem } from '@assessmentis/clinical-domain'

import DisplayQuestionnaireItemForm from '@/modules/resources/Questionnaire/features/QuestionnaireForm/components/DisplayQuestionnaireItemForm/display-questionnaire-item-form'

//👇 This default export determines where your story goes in the story list
const meta = {
  component: DisplayQuestionnaireItemForm,
} satisfies Meta<typeof DisplayQuestionnaireItemForm>

export default meta
type Story = StoryObj<typeof meta>

const arbitraryQuestionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

export const Heading1: Story = {
  args: {
    questionnaireItem: arbitraryQuestionnaireItem.cloneWith({
      text: 'Heading 1',
      type: 'display',
    }),
    uiControl: undefined,
  },
}

export const Heading2: Story = {
  args: {
    questionnaireItem: arbitraryQuestionnaireItem.cloneWith({
      text: 'Heading 2',
      type: 'display',
    }),
    uiControl: undefined,
  },
}

export const Heading3: Story = {
  args: {
    questionnaireItem: arbitraryQuestionnaireItem.cloneWith({
      text: 'Heading 3',
      type: 'display',
    }),
    uiControl: undefined,
  },
}

export const Question: Story = {
  args: {
    questionnaireItem: arbitraryQuestionnaireItem.cloneWith({
      text: 'This is just a question',
      type: 'display',
    }),
    uiControl: undefined,
  },
}
