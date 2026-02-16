import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../../data-types/base/DomainResource'
import { Code } from '../../../data-types/complex/Coding'
import type { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../../data-types/complex/CodeableConcept'
import type {
  Identifier,
  Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../../data-types/complex/IdentifierAndReference'
import type { CompositionAttester } from './CompositionAttester'
import { CompositionAttesterFromFhirR4 } from './CompositionAttester'
import type { CompositionRelatesTo } from './CompositionRelatesTo'
import { CompositionRelatesToFromFhirR4 } from './CompositionRelatesTo'
import type { CompositionEvent } from './CompositionEvent'
import { CompositionEventFromFhirR4 } from './CompositionEvent'
import type { CompositionSection } from './CompositionSection'
import { CompositionSectionFromFhirR4 } from './CompositionSection'

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
export const CompositionFromFhirR4: Schema.Schema<
  Composition,
  fhir.Composition,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(CompositionId),
  Schema.mutable(
    Schema.Struct({
      resourceType: Schema.Literal('Composition'),
      identifier: Schema.optional(Schema.suspend(() => IdentifierFromFhirR4)),
      status: Schema.Union(
        Schema.Literal('preliminary'),
        Schema.Literal('final'),
        Schema.Literal('amended'),
        Schema.Literal('entered-in-error')
      ),
      type: Schema.suspend(() => CodeableConceptFromFhirR4),
      class: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
      subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      encounter: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      date: Schema.DateTimeUtc,
      author: Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))),
      title: Schema.String,
      confidentiality: Schema.optional(Code),
      attester: Schema.optional(Schema.mutable(Schema.Array(CompositionAttesterFromFhirR4))),
      custodian: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      relatesTo: Schema.optional(Schema.mutable(Schema.Array(CompositionRelatesToFromFhirR4))),
      event: Schema.optional(Schema.mutable(Schema.Array(CompositionEventFromFhirR4))),
      section: Schema.optional(Schema.mutable(Schema.Array(CompositionSectionFromFhirR4))),
    })
  )
)
