import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Code } from '../../data-types/complex/Code'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CompositionAttesterSchema } from './CompositionAttester'
import { CompositionEventSchema } from './CompositionEvent'
import { CompositionRelatesToSchema } from './CompositionRelatesTo'
import { CompositionSection } from './CompositionSection'

const Key = 'Composition' as const
type Key = typeof Key

const fields = {
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  status: Schema.Union(
    Schema.Literal('preliminary'),
    Schema.Literal('final'),
    Schema.Literal('amended'),
    Schema.Literal('entered-in-error')
  ),
  type: Schema.suspend(() => CodeableConcept),
  class: Schema.optional(Schema.suspend(() => CodeableConcept)),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  date: Schema.DateTimeUtc,
  author: Schema.Array(Schema.suspend(() => Reference)),
  title: Schema.String,
  confidentiality: Schema.optional(Code),
  attester: Schema.optional(Schema.Array(CompositionAttesterSchema)),
  custodian: Schema.optional(Schema.suspend(() => Reference)),
  relatesTo: Schema.optional(Schema.Array(CompositionRelatesToSchema)),
  event: Schema.optional(Schema.Array(CompositionEventSchema)),
  section: Schema.optional(Schema.Array(CompositionSection)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface CompositionEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * A set of resources composed into a single coherent clinical statement with
 * clinical attestation.
 */
export class Composition extends MergeClasses<Composition>(Key)(
  [],
  resourceMixin,
  fields
) {}
