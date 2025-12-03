import { Schema } from "effect";
import { BackboneElement } from "../../general-purpose/BackboneElement";
import { Coding } from "../../general-purpose/Coding";
import { Resource } from "../../general-purpose/Resource";
export const QuestionnaireId = Schema.String.pipe(
  Schema.brand("QuestionnaireId"),
);

export type QuestionnaireId = typeof QuestionnaireId.Type;

const QuestionItemType = Schema.Union(
  Schema.Literal("group"),
  Schema.Literal("display"),
  Schema.Literal("question"),
  Schema.Literal("boolean"),
  Schema.Literal("decimal"),
  Schema.Literal("integer"),
  Schema.Literal("date"),
  Schema.Literal("dateTime"),
  Schema.Literal("time"),
  Schema.Literal("string"),
  Schema.Literal("text"),
  Schema.Literal("url"),
  Schema.Literal("choice"),
  Schema.Literal("open-choice"),
  Schema.Literal("attachment"),
  Schema.Literal("reference"),
  Schema.Literal("quantity"),
);

export const QuestionnaireItemLink = Schema.String.pipe(
  Schema.brand("QuestionnaireItemLink"),
);
export type QuestionnaireItemLink = typeof QuestionnaireItemLink.Type;

export const QuestionnaireItemId = Schema.String.pipe(
  Schema.brand("QuestionnaireItemId"),
);
export type QuestionnaireItemId = typeof QuestionnaireItemId.Type;

const questionnaireItemFields = {
  ...BackboneElement(QuestionnaireItemId).fields,
  /**
   * This element can be used when the value set machinery of answerValueSet is deemed too cumbersome or when there's a need to capture possible answers that are not codes.
   */
  answerOption: Schema.optional(Schema.Any), //QuestionnaireItemAnswerOption[] | undefined;
  /**
   * LOINC defines many useful value sets for questionnaire responses. See [LOINC Answer Lists](loinc.html#alist). The value may come from the ElementDefinition referred to by .definition.
   */
  answerValueSet: Schema.optional(Schema.String),
  // _answerValueSet?: Element | undefined;
  /**
   * The value may come from the ElementDefinition referred to by .definition.
   */
  code: Schema.optional(Schema.Array(Coding)),
  /**
   * The uri refers to an ElementDefinition in a [StructureDefinition](structuredefinition.html#) and always starts with the [canonical URL](references.html#canonical) for the target resource. When referring to a StructureDefinition, a fragment identifier is used to specify the element definition by its id [Element.id](element-definitions.html#Element.id). E.g. http://hl7.org/fhir/StructureDefinition/Observation#Observation.value[x]. In the absence of a fragment identifier, the first/root element definition in the target is the matching element definition.
   */
  definition: Schema.optional(Schema.String),
  // _definition?: Element | undefined;
  /**
   * This element must be specified if more than one enableWhen value is provided.
   */
  enableBehavior: Schema.optional(
    Schema.Union(
      Schema.Literal("all"),
      Schema.Literal("any"),
      Schema.Undefined,
    ),
  ),
  // _enableBehavior?: Element | undefined;
  /**
   * If multiple repetitions of this extension are present, the item should be enabled when the condition for *any* of the repetitions is true.  I.e. treat "enableWhen"s as being joined by an "or" clause.  This element is a modifier because if enableWhen is present for an item, "required" is ignored unless one of the enableWhen conditions is met. When an item is disabled, all of its descendants are disabled, regardless of what their own enableWhen logic might evaluate to.
   */
  enableWhen: Schema.optional(Schema.Any), //QuestionnaireItemEnableWhen[] | undefined;
  /**
   * The user is allowed to change the value and override the default (unless marked as read-only). If the user doesn't change the value, then this initial value will be persisted when the QuestionnaireResponse is initially created.  Note that initial values can influence results.  The data type of initial[x] must agree with the item.type, and only repeating items can have more then one initial value.
   */
  initial: Schema.optional(Schema.Any), //QuestionnaireItemInitial[] | undefined;
  /**
   * This ''can'' be a meaningful identifier (e.g. a LOINC code) but is not intended to have any meaning.  GUIDs or sequential numbers are appropriate here.
   */
  linkId: QuestionnaireItemLink,
  // _linkId?: Element | undefined;
  /**
   * For base64binary, reflects the number of characters representing the encoded data, not the number of bytes of the binary data. The value may come from the ElementDefinition referred to by .definition.
   */
  maxLength: Schema.optional(Schema.Int),
  /**
   * These are generally unique within a questionnaire, though this is not guaranteed. Some questionnaires may have multiple questions with the same label with logic to control which gets exposed.  Typically, these won't be used for "display" items, though such use is not prohibited.  Systems SHOULD NOT generate their own prefixes if prefixes are defined for any items within a Questionnaire.
   */
  prefix: Schema.optional(Schema.String),
  // _prefix?: Element | undefined;
  /**
   * The value of readOnly elements can be established by asserting  extensions for defaultValues, linkages that support pre-population and/or extensions that support calculation based on other answers.
   */
  readOnly: Schema.optional(Schema.Boolean),
  // _readOnly?: Element | undefined;
  /**
   * If a question is marked as repeats=true, then multiple answers can be provided for the question in the corresponding QuestionnaireResponse.  When rendering the questionnaire, it is up to the rendering software whether to render the question text for each answer repetition (i.e. "repeat the question") or to simply allow entry/selection of multiple answers for the question (repeat the answers).  Which is most appropriate visually may depend on the type of answer as well as whether there are nested items.
   * The resulting QuestionnaireResponse will be populated the same way regardless of rendering - one 'question' item with multiple answer values.
   *  The value may come from the ElementDefinition referred to by .definition.
   */
  repeats: Schema.optional(Schema.Boolean),
  // _repeats?: Element | undefined;
  /**
   * Questionnaire.item.required only has meaning for elements that are conditionally enabled with enableWhen if the condition evaluates to true.  If an item that contains other items is marked as required, that does not automatically make the contained elements required (though required groups must contain at least one child element). The value may come from the ElementDefinition referred to by .definition.
   */
  required: Schema.optional(Schema.Boolean),
  // _required?: Element | undefined;
  /**
   * When using this element to represent the name of a section, use group type item and also make sure to limit the text element to a short string suitable for display as a section heading.  Group item instructions should be included as a display type item within the group.
   */
  text: Schema.optional(Schema.String),
  // _text?: Element | undefined;
  /**
   * Additional constraints on the type of answer can be conveyed by extensions. The value may come from the ElementDefinition referred to by .definition.
   */
  type: QuestionItemType, // ('group'|'display'|'question'|'boolean'|'decimal'|'integer'|'date'|'dateTime'|'time'|'string'|'text'|'url'|'choice'|'open-choice'|'attachment'|'reference'|'quantity');
  // _type?: Element | undefined;
};

export interface QuestionnaireItem extends Schema.Struct.Type<
  typeof questionnaireItemFields
> {
  readonly item?: undefined | ReadonlyArray<QuestionnaireItem>;
}

export interface QuestionnaireItemEncoded extends Schema.Struct.Encoded<
  typeof questionnaireItemFields
> {
  readonly item?: undefined | ReadonlyArray<QuestionnaireItemEncoded>;
}

/**
 * The content of the questionnaire is constructed from an ordered, hierarchical collection of items.
 */
export const QuestionnaireItem = Schema.Struct({
  ...questionnaireItemFields,
  /**
   * There is no specified limit to the depth of nesting.  However, Questionnaire authors are encouraged to consider the impact on the user and user interface of overly deep nesting.
   */
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<QuestionnaireItem, QuestionnaireItemEncoded, never> =>
          QuestionnaireItem,
      ),
    ),
  ),
});

/**
 * A structured set of questions intended to guide the collection of answers from end-users. Questionnaires provide detailed control over order, presentation, phraseology and grouping to allow coherent, consistent data collection.
 */
export const Questionnaire = Schema.Struct({
  ...Resource(QuestionnaireId).fields,
  /** Resource Type Name (for serialization) */
  resourceType: Schema.Literal("Questionnaire"),
  /**
   * The 'date' element may be more recent than the approval date because of minor changes or editorial corrections.
   */
  approvalDate: Schema.optional(Schema.String),
  //_approvalDate?: Element | undefined;
  /**
   * An identifier for this question or group of questions in a particular terminology such as LOINC.
   */
  code: Schema.optional(Schema.Array(Coding)),
  /**
   * May be a web site, an email address, a telephone number, etc.
   */
  contact: Schema.optional(Schema.Any), // ContactDetail[] | undefined;
  /**
   * A copyright statement relating to the questionnaire and/or its contents. Copyright statements are generally legal restrictions on the use and publishing of the questionnaire.
   */
  copyright: Schema.optional(Schema.String),
  // _copyright?: Element | undefined;
  /**
   * Note that this is not the same as the resource last-modified-date, since the resource may be a secondary representation of the questionnaire. Additional specific dates may be added as extensions or be found by consulting Provenances associated with past versions of the resource.
   */
  date: Schema.optional(Schema.String),
  // _date?: Element | undefined;
  /**
   * The URL of a Questionnaire that this Questionnaire is based on.
   */
  derivedFrom: Schema.optional(Schema.Array(Schema.String)),
  // _derivedFrom?: Element[] | undefined;
  /**
   * This description can be used to capture details such as why the questionnaire was built, comments about misuse, instructions for clinical use and interpretation, literature references, examples from the paper world, etc. It is not a rendering of the questionnaire as conveyed in the 'text' field of the resource itself. This item SHOULD be populated unless the information is available from context (e.g. the language of the questionnaire is presumed to be the predominant language in the place the questionnaire was created).
   */
  description: Schema.optional(Schema.String),
  // _description?: Element | undefined;
  /**
   * The effective period for a questionnaire  determines when the content is applicable for usage and is independent of publication and review dates. For example, a measure intended to be used for the year 2016 might be published in 2015.
   */
  effectivePeriod: Schema.optional(Schema.Any), // ?: Period | undefined;
  /**
   * Allows filtering of questionnaires that are appropriate for use versus not.
   */
  experimental: Schema.optional(Schema.Boolean),
  // _experimental?: Element | undefined;
  /**
   * Typically, this is used for identifiers that can go in an HL7 V3 II (instance identifier) data type, and can then identify this questionnaire outside of FHIR, where it is not possible to use the logical URI.
   */
  identifier: Schema.optional(Schema.Any), //?: Identifier[] | undefined;
  /**
   * The content of the questionnaire is constructed from an ordered, hierarchical collection of items.
   */
  item: Schema.optional(Schema.Array(QuestionnaireItem)),
  /**
   * It may be possible for the questionnaire to be used in jurisdictions other than those for which it was originally designed or intended.
   */
  jurisdiction: Schema.optional(Schema.Any), //?: CodeableConcept[] | undefined;
  /**
   * If specified, this date follows the original approval date.
   */
  lastReviewDate: Schema.optional(Schema.String),
  // _lastReviewDate?: Element | undefined;
  /**
   * The name is not expected to be globally unique. The name should be a simple alphanumeric type name to ensure that it is machine-processing friendly.
   */
  name: Schema.optional(Schema.String),
  // _name?: Element | undefined;
  /**
   * Usually an organization but may be an individual. The publisher (or steward) of the questionnaire is the organization or individual primarily responsible for the maintenance and upkeep of the questionnaire. This is not necessarily the same individual or organization that developed and initially authored the content. The publisher is the primary point of contact for questions or issues with the questionnaire. This item SHOULD be populated unless the information is available from context.
   */
  publisher: Schema.optional(Schema.String),
  // _publisher?: Element | undefined;
  /**
   * This element does not describe the usage of the questionnaire. Instead, it provides traceability of ''why'' the resource is either needed or ''why'' it is defined as it is.  This may be used to point to source materials or specifications that drove the structure of this questionnaire.
   */
  purpose: Schema.optional(Schema.String),
  // _purpose?: Element | undefined;
  /**
   * Allows filtering of questionnaires that are appropriate for use versus not.
   */
  status: Schema.Union(
    Schema.Literal("draft"),
    Schema.Literal("active"),
    Schema.Literal("retired"),
    Schema.Literal("unknown"),
  ),
  // _status?: Element | undefined;
  /**
   * If none are specified, then the subject is unlimited.
   */
  subjectType: Schema.optional(Schema.Array(Schema.String)),
  // _subjectType?: Element[] | undefined;
  /**
   * This name does not need to be machine-processing friendly and may contain punctuation, white-space, etc.
   */
  title: Schema.optional(Schema.String),
  // _title?: Element | undefined;
  /**
   * The name of the referenced questionnaire can be conveyed using the http://hl7.org/fhir/StructureDefinition/display extension.
   */
  url: Schema.optional(Schema.String),
  // _url?: Element | undefined;
  /**
   * When multiple useContexts are specified, there is no expectation that all or any of the contexts apply.
   */
  useContext: Schema.optional(Schema.Any), //?: UsageContext[] | undefined;
  /**
   * There may be different questionnaire instances that have the same identifier but different versions.  The version can be appended to the url in a reference to allow a reference to a particular business version of the questionnaire with the format [url]|[version].
   */
  version: Schema.optional(Schema.String),
  // _version?: Element | undefined;
});

export type Questionnaire = typeof Questionnaire.Type;
