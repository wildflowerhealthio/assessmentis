import { Schema } from 'effect'
import { Element } from './Element'
import { CodeableConcept } from './CodeableConcept'
import { Reference, ReferenceEncoded } from './Reference'

export const IdentifierId = Schema.String.pipe(Schema.brand('IdentifierId'))

const IdentifierUse = Schema.Enums({
  usual: 'usual',
  official: 'official',
  temp: 'temp',
  secondary: 'secondary',
  old: 'old',
} as const)

const identifierFields = {
  ...Element(IdentifierId).fields,
  /**
   * Time period during which identifier is/was valid for use.
   */
  period: Schema.optional(Schema.Any), //Period | undefined;
  /**
   * Identifier.system is always case sensitive.
   */
  system: Schema.optional(Schema.String),
  // _system?: Element | undefined;
  /**
   * This element deals only with general categories of identifiers.  It SHOULD not be used for codes that correspond 1..1 with the Identifier.system. Some identifiers may fall into multiple categories due to common usage.   Where the system is known, a type is unnecessary because the type is always part of the system definition. However systems often need to handle identifiers where the system is not known. There is not a 1:1 relationship between type and system, since many different systems have the same type.
   */
  type: Schema.optional(CodeableConcept),
  /**
   * Applications can assume that an identifier is permanent unless it explicitly says that it is temporary.
   */
  use: Schema.optional(IdentifierUse),
  //_use?: Element | undefined;
  /**
   * If the value is a full URI, then the system SHALL be urn:ietf:rfc:3986.  The value's primary purpose is computational mapping.  As a result, it may be normalized for comparison purposes (e.g. removing non-significant whitespace, dashes, etc.)  A value formatted for human display can be conveyed using the [Rendered Value extension](extension-rendered-value.html). Identifier.value is to be treated as case sensitive unless knowledge of the Identifier.system allows the processer to be confident that non-case-sensitive processing is safe.
   */
  value: Schema.optional(Schema.String),
  // _value?: Element | undefined;
}

export interface Identifier extends Schema.Struct.Type<
  typeof identifierFields
> {
  assigner?: Reference | undefined
}

export interface IdentifierEncoded extends Schema.Struct.Encoded<
  typeof identifierFields
> {
  assigner?: ReferenceEncoded | undefined
}

/**
 * An identifier - identifies some entity uniquely and unambiguously. Typically this is used for business identifiers.
 */
export const Identifier = Schema.Struct({
  ...identifierFields,
  /**
   * The Identifier.assigner may omit the .reference element and only contain a .display element reflecting the name or other textual information about the assigning organization.
   */
  assigner: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<Reference, ReferenceEncoded, never> => Reference
    )
  ),
})
