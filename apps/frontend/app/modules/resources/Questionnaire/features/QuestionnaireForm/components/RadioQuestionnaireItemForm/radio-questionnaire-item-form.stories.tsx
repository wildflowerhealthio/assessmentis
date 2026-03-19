// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Arbitrary, FastCheck } from 'effect'

import {
  QuestionnaireItem,
  QuestionnaireItemAnswerOption,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain'

import { action } from 'storybook/actions'
import RadioQuestionnaireItemForm, {
  RadioQuestionnaireItemFormGroup,
} from '@/modules/resources/Questionnaire/features/QuestionnaireForm/components/RadioQuestionnaireItemForm/radio-questionnaire-item-form'

//👇 This default export determines where your story goes in the story list
const meta = {
  component: RadioQuestionnaireItemForm,
} satisfies Meta<typeof RadioQuestionnaireItemForm>

export default meta
type Story = StoryObj<typeof meta>

const questionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

const arbitraryProps = {
  questionnaireItem: questionnaireItem.cloneWith({
    answerOption: [
      QuestionnaireItemAnswerOption.make({
        value: { _tag: 'boolean', boolean: true },
      }),
      QuestionnaireItemAnswerOption.make({
        value: { _tag: 'boolean', boolean: false },
      }),
    ],
    text: 'Do you often interrupt the activities of others, or intrude on others?',
    type: 'boolean',
  }),
  questionnaireResponseItem: QuestionnaireResponseItem.make({
    linkId: questionnaireItem.linkId,
  }),
  setQuestionnaireResponseItem: action('setQuestionnaireResponseItem'),
  uiControl: undefined,
}

export const RegularBooleanQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // Style: QuestionnaireItemStyle.QUESTION,
    }),
  },
}

export const GridStyleBooleanQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // Style: QuestionnaireItemStyle.WITHIN_QUESTION,
    }),
  },
  render: (args) => (
    <RadioQuestionnaireItemFormGroup answerOption={args.questionnaireItem.answerOption ?? []}>
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
    </RadioQuestionnaireItemFormGroup>
  ),
}

export const StringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // Style: QuestionnaireItemStyle.QUESTION,
      answerOption: [
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Red' },
        }),
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Green' },
        }),
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Blue' },
        }),
      ],
    }),
  },
}

export const GridStyleStringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: arbitraryProps.questionnaireItem.cloneWith({
      // Style: QuestionnaireItemStyle.WITHIN_QUESTION,
      answerOption: [
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Red' },
        }),
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Green' },
        }),
        QuestionnaireItemAnswerOption.make({
          value: { _tag: 'string', string: 'Blue' },
        }),
      ],
    }),
  },

  render: (args) => (
    <RadioQuestionnaireItemFormGroup answerOption={args.questionnaireItem.answerOption!}>
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
    </RadioQuestionnaireItemFormGroup>
  ),
}
