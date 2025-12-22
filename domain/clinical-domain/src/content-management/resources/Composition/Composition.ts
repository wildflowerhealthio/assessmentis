import { Schema } from 'effect'
import {
  Code,
  CodeableConcept,
  Narrative,
  Reference,
  DomainResource,
  Element,
  Meta,
  Identifier,
} from '@assessmentis/clinical-domain/data-types'
import { CompositionAttester } from './CompositionAttester'
import { CompositionRelatesTo } from './CompositionRelatesTo'
import { CompositionEvent } from './CompositionEvent'
import { CompositionSection } from './CompositionSection'

export const CompositionId = Schema.String.pipe(Schema.brand('CompositionId'))

export type CompositionId = typeof CompositionId.Type

/**
 * A set of resources composed into a single coherent clinical statement with clinical attestation
 */
export const Composition = Schema.Struct({
  ...DomainResource(CompositionId).fields,
  /**
   * Resource Type Name (for serialization)
   */
  resourceType: Schema.Literal('Composition'),
  /**
   * Logical id of this artifact
   */
  id: Schema.optional(CompositionId),
  /**
   * Metadata about the resource
   */
  meta: Schema.optional(Meta),
  /**
   * A set of rules under which this content was created
   */
  implicitRules: Schema.optional(Schema.String),
  /**
   * Contains extended information for property 'implicitRules'.
   */
  _implicitRules: Schema.optional(Element(Schema.String)),
  /**
   * Language of the resource content
   */
  language: Schema.optional(Code),
  /**
   * Contains extended information for property 'language'.
   */
  _language: Schema.optional(Element(Schema.String)),
  /**
   * Text summary of the resource, for human interpretation
   */
  text: Schema.optional(Narrative),
  /**
   * Logical identifier of composition (version-independent)
   */
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  /**
   * preliminary | final | amended | entered-in-error
   */
  status: Schema.Union(
    Schema.Literal('preliminary'),
    Schema.Literal('final'),
    Schema.Literal('amended'),
    Schema.Literal('entered-in-error')
  ),
  /**
   * Contains extended information for property 'status'.
   */
  _status: Schema.optional(Element(Schema.String)),
  /**
   * Kind of composition (LOINC if possible)
   */
  type: CodeableConcept,
  /**
   * Categorization of Composition
   */
  class: Schema.optional(CodeableConcept),
  /**
   * Who and/or what the composition is about
   */
  subject: Schema.suspend(() => Reference),
  /**
   * Context of the Composition
   */
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  /**
   * Composition editing time
   */
  date: Schema.String,
  /**
   * Contains extended information for property 'date'.
   */
  _date: Schema.optional(Element(Schema.String)),
  /**
   * Who and/or what authored the composition
   */
  author: Schema.Array(Schema.suspend(() => Reference)),
  /**
   * Human Readable name/title
   */
  title: Schema.String,
  /**
   * Contains extended information for property 'title'.
   */
  _title: Schema.optional(Element(Schema.String)),
  /**
   * As defined by affinity domain
   */
  confidentiality: Schema.optional(Code),
  /**
   * Contains extended information for property 'confidentiality'.
   */
  _confidentiality: Schema.optional(Element(Schema.String)),
  /**
   * Attests to accuracy of composition
   */
  attester: Schema.optional(Schema.Array(CompositionAttester)),
  /**
   * Organization which maintains the composition
   */
  custodian: Schema.optional(Schema.suspend(() => Reference)),
  /**
   * Relationships to other compositions/documents
   */
  relatesTo: Schema.optional(Schema.Array(CompositionRelatesTo)),
  /**
   * The clinical service(s) being documented
   */
  event: Schema.optional(Schema.Array(CompositionEvent)),
  /**
   * Composition is broken into sections
   */
  section: Schema.optional(Schema.Array(CompositionSection)),
})

export type Composition = typeof Composition.Type
