import { DateTime, Schema } from 'effect'
import { Code, Coding } from '../complex/Coding'
import { Reference, ReferenceEncoded } from '../complex/IdentifierAndReference'
import { Extension, ExtensionEncoded } from '../special-purpose/Extension'
import { CodeableConcept } from '../complex'

const Attachment = Schema.Struct({ contentType: Schema.optional(Code) })
const Quantity = Schema.Struct({ value: Schema.optional(Schema.Number) })

export type ValueElement =
  | {
      valueBoolean: boolean
    }
  | {
      valueDecimal: number
    }
  | {
      valueInteger: number
      _valueInteger?: { extension?: Extension[] }
    }
  | {
      valueDate: string
    }
  | {
      valueDateTime: DateTime.Utc
    }
  | {
      valueTime: string
    }
  | {
      valueString: string
    }
  | {
      valueUrl: string
    }
  | {
      valueAttachment: typeof Attachment.Type
    }
  | {
      valueCoding: typeof Coding.Type
    }
  | {
      valueQuantity: typeof Quantity.Type
    }
  | {
      valueReference: Reference
    }
  | {
      valueCode: typeof Code.Type
      _valueCode?: { extension?: Extension[] }
    }
  | {
      valueCodeableConcept: CodeableConcept
    }
  | {
      valueCanonical: string
    }
  | object

export type ValueElementEncoded =
  | {
      valueBoolean: boolean
    }
  | {
      valueDecimal: number
    }
  | {
      valueInteger: number
      _valueInteger?: { extension?: ExtensionEncoded[] }
    }
  | {
      valueDate: string
    }
  | {
      valueDateTime: string
    }
  | {
      valueTime: string
    }
  | {
      valueString: string
    }
  | {
      valueUrl: string
    }
  | {
      valueAttachment: typeof Attachment.Encoded
    }
  | {
      valueCoding: typeof Coding.Encoded
    }
  | {
      valueQuantity: typeof Quantity.Encoded
    }
  | {
      valueReference: ReferenceEncoded
    }
  | {
      valueCode: typeof Code.Encoded
      _valueCode?: { extension?: ExtensionEncoded[] }
    }
  | {
      valueCodeableConcept: typeof CodeableConcept.Encoded
    }
  | {
      valueCanonical: string
    }
  | object

const extensionObj = () =>
  Schema.optional(Schema.Array(Schema.suspend(() => Extension)))

export const ValueElement = Schema.Union(
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueBoolean: Schema.Boolean,
    // _valueBoolean?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueDecimal: Schema.Number,
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueInteger: Schema.Number,
    _valueInteger: extensionObj(),
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueDate: Schema.String,
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
    valueTime: Schema.String,
    // _valueTime?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueString: Schema.String,
    // _valueString?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueUrl: Schema.String,
    // _valueUrl?: Element | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueAttachment: Attachment, // Attachment | undefined;
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueCoding: Coding,
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueQuantity: Quantity,
  }),
  Schema.Struct({
    /**
     * More complex structures (Attachment, Resource and Quantity) will typically be limited to electronic forms that can expose an appropriate user interface to capture the components and enforce the constraints of a complex data type.  Additional complex types can be introduced through extensions. Must match the datatype specified by Questionnaire.item.type in the corresponding Questionnaire.
     */
    valueReference: Schema.suspend(() => Reference),
  }),
  Schema.Struct({
    valueCode: Code,
    _valueCode: extensionObj(),
  }),
  Schema.Struct({
    valueCodeableConcept: CodeableConcept,
  }),
  Schema.Struct({
    valueCanonical: Schema.String,
  }),
  Schema.Struct({})
)
