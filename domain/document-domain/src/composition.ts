import { Schema } from 'effect'
import {
  Code,
  CodeableConcept,
  Identifier,
  Narrative,
  Reference,
} from '@assessmentis/clinical-domain'
import {
  BackboneElement,
  Element,
} from '@assessmentis/clinical-domain/general-purpose'

const SectionId = Schema.String.pipe(Schema.brand('SectionId'))

const sectionFields = {
  ...BackboneElement(SectionId).fields,
  /**
   * Label for section (e.g. for ToC)
   */
  title: Schema.optional(Schema.String),
  /**
   * Contains extended information for property 'title'.
   */
  _title: Schema.optional(Element(Schema.String)),
  /**
   * Classification of section (recommended)
   */
  code: Schema.optional(CodeableConcept),
  /**
   * Text summary of the section, for human interpretation
   */
  text: Schema.optional(Narrative),
  /**
   * working | snapshot | changes
   */
  mode: Schema.optional(
    Schema.Union(
      Schema.Literal('working'),
      Schema.Literal('snapshot'),
      Schema.Literal('changes')
    )
  ),
  /**
   * Contains extended information for property 'mode'.
   */
  _mode: Schema.optional(Element(Schema.String)),
  /**
   * Order of section entries
   */
  orderedBy: Schema.optional(CodeableConcept),
  /**
   * A reference to data that supports this section
   */
  entry: Schema.optional(Schema.Array(Reference)),
  /**
   * Why the section is empty
   */
  emptyReason: Schema.optional(CodeableConcept),
}

export interface CompositionSection extends Schema.Struct.Type<
  typeof sectionFields
> {
  /**
   * Nested Section
   */
  readonly section?: undefined | ReadonlyArray<CompositionSection>
}

export interface CompositionSectionEncoded extends Schema.Struct.Encoded<
  typeof sectionFields
> {
  /**
   * Nested Section
   */
  readonly section?: undefined | ReadonlyArray<CompositionSectionEncoded>
}

/**
 * Composition is broken into sections
 */
export const Section = Schema.Struct({
  ...sectionFields,
  /**
   * Nested Section
   */
  section: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          CompositionSection,
          CompositionSectionEncoded,
          never
        > => Section
      )
    )
  ),
})

export type Section = typeof Section.Type

/**
 * Attests to accuracy of composition
 */
export const CompositionAttester = Schema.Struct({
  ...BackboneElement(Schema.String).fields,
  /**
   * personal | professional | legal | official
   */
  mode: Schema.Array(
    Schema.Union(
      Schema.Literal('personal'),
      Schema.Literal('professional'),
      Schema.Literal('legal'),
      Schema.Literal('official')
    )
  ),
  /**
   * Contains extended information for property 'mode'.
   */
  _mode: Schema.optional(Schema.Array(Element(Schema.String))),
  /**
   * When the composition was attested
   */
  time: Schema.optional(Schema.String),
  /**
   * Contains extended information for property 'time'.
   */
  _time: Schema.optional(Element(Schema.String)),
  /**
   * Who attested the composition
   */
  party: Schema.optional(Reference),
})

export type CompositionAttester = typeof CompositionAttester.Type

/**
 * Relationships to other compositions/documents
 */
export const CompositionRelatesTo = Schema.Struct({
  ...BackboneElement(Schema.String).fields,
  /**
   * replaces | transforms | signs | appends
   */
  code: Schema.Union(
    Schema.Literal('replaces'),
    Schema.Literal('transforms'),
    Schema.Literal('signs'),
    Schema.Literal('appends')
  ),
  /**
   * Contains extended information for property 'code'.
   */
  _code: Schema.optional(Element(Schema.String)),
  /**
   * Target of the relationship
   */
  targetIdentifier: Schema.optional(Identifier),
  /**
   * Target of the relationship
   */
  targetReference: Schema.optional(Reference),
})

export type CompositionRelatesTo = typeof CompositionRelatesTo.Type

/**
 * The clinical service(s) being documented
 */
export const CompositionEvent = Schema.Struct({
  ...BackboneElement(Schema.String).fields,
  /**
   * Code(s) that apply to the event being documented
   */
  code: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * The period covered by the documentation
   */
  period: Schema.optional(Schema.Any), // Period type - simplified as Any
  /**
   * The event(s) being documented
   */
  detail: Schema.optional(Schema.Array(Reference)),
})

export type CompositionEvent = typeof CompositionEvent.Type

export const CompositionId = Schema.String.pipe(Schema.brand('CompositionId'))

export type CompositionId = typeof CompositionId.Type

/**
 * A set of resources composed into a single coherent clinical statement with clinical attestation
 */
export const Composition = Schema.Struct({
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
  meta: Schema.optional(Schema.Any),
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
   * Contained, inline Resources
   */
  contained: Schema.optional(Schema.Array(Schema.Any)),
  /**
   * Additional content defined by implementations
   */
  extension: Schema.optional(Schema.Array(Schema.Any)),
  /**
   * Extensions that cannot be ignored
   */
  modifierExtension: Schema.optional(Schema.Array(Schema.Any)),
  /**
   * Logical identifier of composition (version-independent)
   */
  identifier: Schema.optional(Identifier),
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
  subject: Reference,
  /**
   * Context of the Composition
   */
  encounter: Schema.optional(Reference),
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
  author: Schema.Array(Reference),
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
  custodian: Schema.optional(Reference),
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
  section: Schema.optional(Schema.Array(Section)),
})

export type Composition = typeof Composition.Type
