import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type { Composition as FhirComposition } from 'fhir/r4'
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
import type { DeepReadonly } from '@assessmentis/util'

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
  author: ReadonlyArray<Reference>
  title: string
  confidentiality?: Code
  attester?: ReadonlyArray<CompositionAttester>
  custodian?: Reference
  relatesTo?: ReadonlyArray<CompositionRelatesTo>
  event?: ReadonlyArray<CompositionEvent>
  section?: ReadonlyArray<CompositionSection>
}

/**
 * Schema for transforming between Composition Data objects and FHIR R4 Composition resources.
 */
export const CompositionFromFhirR4: Schema.Schema<
  Composition,
  DeepReadonly<FhirComposition>,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(CompositionId),
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
    author: Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)),
    title: Schema.String,
    confidentiality: Schema.optional(Code),
    attester: Schema.optional(Schema.Array(CompositionAttesterFromFhirR4)),
    custodian: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    relatesTo: Schema.optional(Schema.Array(CompositionRelatesToFromFhirR4)),
    event: Schema.optional(Schema.Array(CompositionEventFromFhirR4)),
    section: Schema.optional(Schema.Array(CompositionSectionFromFhirR4)),
  })
)
