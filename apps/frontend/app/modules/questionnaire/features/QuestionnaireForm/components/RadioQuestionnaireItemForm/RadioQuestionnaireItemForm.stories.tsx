// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Arbitrary, FastCheck } from "effect";
import { action } from "storybook/actions";
import { QuestionnaireItemType } from "assessmentis-domain";
import { QuestionnaireItem } from "assessmentis-domain";
import RadioQuestionnaireItemForm, {
  RadioQuestionnaireItemFormGroup,
} from "app/modules/questionnaire/features/QuestionnaireForm/components/RadioQuestionnaireItemForm/RadioQuestionnaireItemForm";

//👇 This default export determines where your story goes in the story list
const meta = {
  component: RadioQuestionnaireItemForm,
} satisfies Meta<typeof RadioQuestionnaireItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const arbitraryProps = {
  questionnaireItem: {
    ...FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0],
    type: QuestionnaireItemType.enums.boolean,
    text: "Do you often interrupt the activities of others, or intrude on others?",
    answerOption: [{ initialSelected: true }, { initialSelected: false }],
  },
  answer: { valueBoolean: true },
  setAnswer: action("set-answer"),
  onSubmit: action("on-submit"),
  uiControl: undefined,
};

export const RegularBooleanQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    },
  },
};

export const GridStyleBooleanQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    },
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
};

export const StringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
      answerOption: [
        { valueString: "Red" },
        { valueString: "Green" },
        { valueString: "Blue" },
      ],
    },
    answer: { valueString: "Green" },
  },
};

export const GridStyleStringQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
      answerOption: [
        { valueString: "Red" },
        { valueString: "Green" },
        { valueString: "Blue" },
      ],
    },
    answer: { valueString: "Green" },
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
};
