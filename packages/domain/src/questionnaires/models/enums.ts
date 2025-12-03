import { Schema } from "effect";


export const QuestionnaireItemType = Schema.Enums(
  {
  /**
   * Question with a long (potentially multi-paragraph) free-text entry answer (valueString).
   */
  text: "text",
  /**
   * An item with no direct answer but should have at least one child item.
   */
  group: "group",
  /**
   * Boolean question, yes or no
   */
  boolean: "boolean",
  /**
   * A question that only displays the text
   */
  display: "display",
} as const);

export const questionItemTypes: [
  typeof QuestionnaireItemType.enums.text,
  // QuestionnaireItemType.CODING,
  typeof QuestionnaireItemType.enums.group,
  typeof QuestionnaireItemType.enums.boolean,
  typeof QuestionnaireItemType.enums.display,
] = [
  QuestionnaireItemType.enums.text,
  // QuestionnaireItemType.CODING,
  QuestionnaireItemType.enums.group,
  QuestionnaireItemType.enums.boolean,
  QuestionnaireItemType.enums.display,
] as const;


export const QuestionnaireItemStyle = Schema.Enums({
  /// The biggest heading, there should only be one H1
  heading1: "heading1",
  /// The second biggest heading, there can be many
  heading2 : "heading2",
  /// The third biggest heading, they must be logically under an H2
  heading3 : "heading3",
  /// Display as an independent question
  question : "question",
  /// Display in a style to fit within a question
  within_question : "within_question",
} as const);

export const questionnaireItemStyles: [
  typeof QuestionnaireItemStyle.enums.heading1,
  typeof QuestionnaireItemStyle.enums.heading2,
  typeof QuestionnaireItemStyle.enums.heading3,
  typeof QuestionnaireItemStyle.enums.question,
  typeof QuestionnaireItemStyle.enums.within_question,
] = [
  QuestionnaireItemStyle.enums.heading1,
  QuestionnaireItemStyle.enums.heading2,
  QuestionnaireItemStyle.enums.heading3,
  QuestionnaireItemStyle.enums.question,
  QuestionnaireItemStyle.enums.within_question,
] as const;
