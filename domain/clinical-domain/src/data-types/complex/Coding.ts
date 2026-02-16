import { Schema } from 'effect'
import type fhir from 'fhir/r4'
export const Code = Schema.String.pipe(Schema.brand('code'))

export type Code = typeof Code.Type
export interface Coding {
  readonly code?: Code
  readonly display?: string
  readonly system?: string
  readonly userSelected?: boolean
  readonly version?: string
}

/**
 * A reference to a code defined by a terminology system.
 */
export const CodingFromFhirR4: Schema.Schema<Coding, fhir.Coding, never> =
  Schema.mutable(
    Schema.Struct({
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
    })
  )

// Backwards compatibility alias
export const Coding = CodingFromFhirR4
