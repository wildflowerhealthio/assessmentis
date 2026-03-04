// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Arbitrary, FastCheck } from 'effect'

import {
  QuestionnaireItem,
  QuestionnaireItemAnswerOption,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain'

import RadioQuestionnaireItemForm, {
  RadioQuestionnaireItemFormGroup,
} from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/components/RadioQuestionnaireItemForm/RadioQuestionnaireItemForm'
import { action } from 'storybook/actions'

//👇 This default export determines where your story goes in the story list
const meta = {
  component: RadioQuestionnaireItemForm,
} satisfies Meta<typeof RadioQuestionnaireItemForm>

export default meta
type Story = StoryObj<typeof meta>

const questionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

const arbitraryProps = {
  questionnaireItem: QuestionnaireItem.make({
    ...questionnaireItem,
    type: 'boolean',
    text: 'Do you often interrupt the activities of others, or intrude on others?',
    answerOption: [
      QuestionnaireItemAnswerOption.make({ valueBoolean: true }),
      QuestionnaireItemAnswerOption.make({ valueBoolean: false }),
    ],
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
    questionnaireItem: QuestionnaireItem.make({
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    }),
  },
}

export const GridStyleBooleanQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: QuestionnaireItem.make({
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    }),
  },
  render: (args) => (
    <RadioQuestionnaireItemFormGroup
      answerOption={args.questionnaireItem.answerOption ?? []}
    >
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
    </RadioQuestionnaireItemFormGroup>
  ),
}

export const StringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: QuestionnaireItem.make({
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
      answerOption: [
        QuestionnaireItemAnswerOption.make({ valueString: 'Red' }),
        QuestionnaireItemAnswerOption.make({ valueString: 'Green' }),
        QuestionnaireItemAnswerOption.make({ valueString: 'Blue' }),
      ],
    }),
  },
}

export const GridStyleStringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: QuestionnaireItem.make({
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
      answerOption: [
        QuestionnaireItemAnswerOption.make({ valueString: 'Red' }),
        QuestionnaireItemAnswerOption.make({ valueString: 'Green' }),
        QuestionnaireItemAnswerOption.make({ valueString: 'Blue' }),
      ],
    }),
  },

  render: (args) => (
    <RadioQuestionnaireItemFormGroup
      answerOption={args.questionnaireItem.answerOption!}
    >
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
      <RadioQuestionnaireItemForm {...args} />
    </RadioQuestionnaireItemFormGroup>
  ),
}
