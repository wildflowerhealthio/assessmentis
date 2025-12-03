// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Arbitrary, FastCheck } from "effect";
import { action } from "storybook/actions";
import { QuestionnaireItemType } from "assessmentis-domain";
import { QuestionnaireItem } from "assessmentis-domain";
import TextQuestionnaireItemForm from "app/modules/questionnaire/features/QuestionnaireForm/components/TextQuestionnaireItemForm/TextQuestionnaireItemForm";

//👇 This default export determines where your story goes in the story list
const meta = {
  component: TextQuestionnaireItemForm,
} satisfies Meta<typeof TextQuestionnaireItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const questionnaireItem = FastCheck.sample(Arbitrary.make(QuestionnaireItem))[0]

const arbitraryProps = {
  questionnaireItem: {
    ...questionnaireItem,
    type: QuestionnaireItemType.enums.text,
    text: "Do you often interrupt the activities of others, or intrude on others?",
  },
  questionnaireResponseItem: {
    linkId: questionnaireItem.linkId,
    answer: [
      {valueString: "some text"}
    ]
  },
  setQuestionnaireResponseItem: action("setQuestionnaireResponseItem"),
  uiControl: undefined
};

export const RegularQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    },
  },
};

export const WithinQuestion: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
    },
    uiControl: 'table' as any
  },
};

export const RegularQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.QUESTION,
    },
    area: true,
  },
};

export const WithinQuestionArea: Story = {
  args: {
    ...arbitraryProps,
    questionnaireItem: {
      ...arbitraryProps.questionnaireItem,
      // style: QuestionnaireItemStyle.WITHIN_QUESTION,
    },
    area: true,
  },
};
