import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Element, type ElementEncoded } from '../base/Element'
import { Code } from './Code'

const Key = 'Coding' as const

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

const ElementMixin = Element(Key)

export interface CodingEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<typeof Key> {}

export class Coding extends MergeClasses<Coding>(Key)(
  [],
  ElementMixin,
  fields
) {}
