import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Code } from '../../data-types/complex/code'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { CompositionAttester } from './composition-attester'
import { CompositionEventSchema } from './composition-event'
import { CompositionRelatesToSchema } from './composition-relates-to'
import { CompositionSection } from './composition-section'

const DomainType = 'Composition' as const
type DomainType = typeof DomainType

const fields = {
  attester: Schema.optional(
    Schema.Array(CompositionAttester).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  author: Schema.Array(Schema.suspend(() => Reference)),
  class: Schema.optional(Schema.suspend(() => CodeableConcept)),
  confidentiality: Schema.optional(Code),
  custodian: Schema.optional(Schema.suspend(() => Reference)),
  date: Schema.DateTimeUtc,
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  event: Schema.optional(
    Schema.Array(CompositionEventSchema).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  relatesTo: Schema.optional(
    Schema.Array(CompositionRelatesToSchema).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  section: Schema.optional(
    Schema.Array(CompositionSection).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  status: Schema.Union(
    Schema.Literal('preliminary'),
    Schema.Literal('final'),
    Schema.Literal('amended'),
    Schema.Literal('entered-in-error')
  ),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  title: Schema.String,
  type: Schema.suspend(() => CodeableConcept),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Composition}. */
export interface CompositionEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A set of resources composed into a single coherent clinical statement with
 * clinical attestation.
 */
export class Composition extends MergeClasses<Composition>(DomainType)([], resourceMixin, fields) {
  readonly cloneWith = makeCloneWith(Composition, this)
}
