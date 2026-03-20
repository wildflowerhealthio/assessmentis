import { Schema } from 'effect'

import { Element } from '../base/element'
import type { ElementEncoded } from '../base/element'
import { Datatype } from '../datatype'
import { Code } from './code'

const DomainType = 'Coding' as const

const fields = {
  /**
   * A symbol in syntax defined by the system. The symbol may be a predefined code or an expression in a syntax defined by the coding system (e.g. post-coordination).
   */
  code: Schema.optional(Code),
  //_code?: Element | undefined;
  /**
   * A representation of the meaning of the code in the system, following the rules of the system.
   */
  display: Schema.optional(Schema.String),
  //_display?: Element | undefined;
  /**
   * The URI may be an OID (urn:oid:...) or a UUID (urn:uuid:...).  OIDs and UUIDs SHALL be references to the HL7 OID registry. Otherwise, the URI should come from HL7's list of FHIR defined special URIs or it should reference to some definition that establishes the system clearly and unambiguously.
   */
  system: Schema.optional(Schema.String),
  //_system?: Element | undefined;
  /**
   * Amongst a set of alternatives, a directly chosen code is the most appropriate starting point for new translations. There is some ambiguity about what exactly 'directly chosen' implies, and trading partner agreement may be needed to clarify the use of this element and its consequences more completely.
   */
  userSelected: Schema.optional(Schema.Boolean),
  // _userSelected?: Element | undefined;
  /**
   * Where the terminology does not clearly define what string should be used to identify code system versions, the recommendation is to use the date (expressed in FHIR date format) on which that version was officially published as the version date.
   */
  version: Schema.optional(Schema.String),
  // _version?: Element | undefined;
} as const satisfies Schema.Struct.Fields

const CodingElement = Element(DomainType)

/** Encoded (wire-format) shape of a {@link Coding}. */
export interface CodingEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<typeof DomainType> {}

/**
 * A reference to a code defined by a terminology system. Binds a `code` to
 * a `system` URI and optional `display` text.
 */
export class Coding extends CodingElement.extend<Coding>(DomainType)(fields) {
  static readonly DomainType = CodingElement.DomainType
  static readonly UrlSchema = CodingElement.UrlSchema
  static Datatype = Datatype('Coding', Coding)

  static makeLiteral = <C extends ConstructorParameters<typeof Coding>[0]>(params: C): Coding & C =>
    Coding.makeLiteral<C>(params)
}
