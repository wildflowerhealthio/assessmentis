// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Arbitrary, FastCheck } from "effect";
import { QuestionnaireItemType } from "assessmentis-domain";
import { QuestionnaireItem } from "assessmentis-domain";
import DisplayQuestionnaireItemForm from "app/modules/questionnaire/features/QuestionnaireForm/components/DisplayQuestionnaireItemForm/DisplayQuestionnaireItemForm";

//👇 This default export determines where your story goes in the story list
const meta = {
  component: DisplayQuestionnaireItemForm,
} satisfies Meta<typeof DisplayQuestionnaireItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const arbitraryQuestionnaireItem = FastCheck.sample(
  Arbitrary.make(QuestionnaireItem),
)[0];

export const Heading1: Story = {
  args: {
    uiControl: undefined,
    questionnaireItem: {
      ...arbitraryQuestionnaireItem,
      text: "Heading 1",
      type: QuestionnaireItemType.enums.display,
      // style: QuestionnaireItemStyle.HEADING1,
    },
  },
};

export const Heading2: Story = {
  args: {
    uiControl: undefined,
    questionnaireItem: {
      ...arbitraryQuestionnaireItem,
      text: "Heading 2",
      type: QuestionnaireItemType.enums.display,
      // style: QuestionnaireItemStyle.HEADING2,
    },
  },
};

export const Heading3: Story = {
  args: {
    uiControl: undefined,
    questionnaireItem: {
      ...arbitraryQuestionnaireItem,
      text: "Heading 3",
      type: QuestionnaireItemType.enums.display,
      // style: QuestionnaireItemStyle.HEADING3,
    },
  },
};

export const Question: Story = {
  args: {
    uiControl: undefined,
    questionnaireItem: {
      ...arbitraryQuestionnaireItem,
      text: "This is just a question",
      type: QuestionnaireItemType.enums.display,
      // style: QuestionnaireItemStyle.QUESTION,
    },
  },
};
