import { Schema } from "effect";
import { Code, Coding } from "./Coding";
import { Reference } from "./Reference";

const Attachment = Schema.Struct({ contentType: Schema.optional(Code)});
const Quantity = Schema.Struct({value: Schema.optional(Schema.Number)});

/**
 * Single-valued answer to the question
 */

export const ValueElement = Schema.Union(
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueBoolean: (Schema.Boolean),
    // _valueBoolean?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueDecimal: (Schema.Number),
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueInteger: (Schema.Number),
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueDate: (Schema.String),
    // _valueDate?: Element | undefined,
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueDateTime: Schema.DateTimeUtc,
    // _valueDateTime?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueTime: (Schema.String),
    // _valueTime?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueString: (Schema.String),
    // _valueString?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueUri: (Schema.URL),
    // _valueUri?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueAttachment: (Attachment), // Attachment | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueCoding: (Coding),
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueQuantity: (Quantity), //  | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueReference: (Reference),
  }),
  Schema.Struct({
    valueCode: (Code),
  }),
  Schema.Struct({
  })
);

export type ValueElement = typeof ValueElement.Type;
