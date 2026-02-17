import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../../ClinicalResourceBehaviour'
import { DomainResource } from '../../../data-types/base/DomainResource'
import { Code } from '../../../data-types/complex/Coding'
import { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import {
  Identifier,
  Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import { CompositionAttester } from './CompositionAttester'
import { CompositionRelatesTo } from './CompositionRelatesTo'
import { CompositionEvent } from './CompositionEvent'
import { CompositionSection } from './CompositionSection'

const TypeId: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Composition'
)
type TypeId = typeof TypeId

export const CompositionId = Schema.String.pipe(Schema.brand('CompositionId'))

export type CompositionId = typeof CompositionId.Type

/**
 * A set of resources composed into a single coherent clinical statement with clinical attestation
 */
export interface Composition extends DomainResource<CompositionId> {
  resourceType: 'Composition'
  identifier?: Identifier
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  type: CodeableConcept
  class?: CodeableConcept
  subject?: Reference
  encounter?: Reference
  date: DateTime.Utc
  author: Reference[]
  title: string
  confidentiality?: Code
  attester?: CompositionAttester[]
  custodian?: Reference
  relatesTo?: CompositionRelatesTo[]
  event?: CompositionEvent[]
  section?: CompositionSection[]
}

/**
 * Schema for transforming between Composition Data objects and FHIR R4 Composition resources.
 */
export const Composition = ClinicalResourceBehaviourImpl({
  TypeId,
  resourceType: 'Composition',
  Schema: Schema.extend(
    DomainResource.Schema(CompositionId),
    Schema.mutable(
      Schema.Struct({
        resourceType: Schema.Literal('Composition'),
        identifier: Schema.optional(Schema.suspend(() => Identifier.Schema)),
        status: Schema.Union(
          Schema.Literal('preliminary'),
          Schema.Literal('final'),
          Schema.Literal('amended'),
          Schema.Literal('entered-in-error')
        ),
        type: Schema.suspend(() => CodeableConcept.Schema),
        class: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
        subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
        encounter: Schema.optional(Schema.suspend(() => Reference.Schema)),
        date: Schema.DateTimeUtc,
        author: Schema.mutable(
          Schema.Array(Schema.suspend(() => Reference.Schema))
        ),
        title: Schema.String,
        confidentiality: Schema.optional(Code),
        attester: Schema.optional(
          Schema.mutable(Schema.Array(CompositionAttester.Schema))
        ),
        custodian: Schema.optional(Schema.suspend(() => Reference.Schema)),
        relatesTo: Schema.optional(
          Schema.mutable(Schema.Array(CompositionRelatesTo.Schema))
        ),
        event: Schema.optional(
          Schema.mutable(Schema.Array(CompositionEvent.Schema))
        ),
        section: Schema.optional(
          Schema.mutable(Schema.Array(CompositionSection.Schema))
        ),
      })
    )
  ),
})
