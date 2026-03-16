import { pipe, Schema } from 'effect'
import type { FastCheck } from 'effect'

import { mergeArbitraries, MergeClasses } from '@assessmentis/util'

import { BackboneElement } from '../../data-types/base/BackboneElement'
import type { BackboneElementEncoded } from '../../data-types/base/BackboneElement'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Reference } from '../../data-types/complex/IdentifierAndReference'
import { Narrative } from '../../data-types/special-purpose/Narrative'

const fields = {
  title: Schema.optional(Schema.String),
  code: Schema.optional(Schema.suspend(() => CodeableConcept)),
  text: Schema.optional(Schema.suspend(() => Narrative)),
  mode: Schema.optional(
    Schema.Union(
      Schema.Literal('working'),
      Schema.Literal('snapshot'),
      Schema.Literal('changes')
    )
  ),
  orderedBy: Schema.optional(Schema.suspend(() => CodeableConcept)),
  entry: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  emptyReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link CompositionSection}, including recursive nested sections. */
export interface CompositionSectionEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'CompositionSection'> {
  section?: ReadonlyArray<CompositionSectionEncoded> | undefined
}

const BackboneElementMixin = BackboneElement('CompositionSection')
/**
 * Composition is broken into sections
 */
export class CompositionSection extends MergeClasses<CompositionSection>(
  'CompositionSection'
)(
  [
    {
      arbitrary:
        () =>
        (fc: typeof FastCheck): FastCheck.Arbitrary<CompositionSection> =>
          fc.letrec<{ self: CompositionSection }>((tie) => ({
            self: mergeArbitraries(
              (props) => new CompositionSection(props),
              fields,
              BackboneElementMixin,
              (
                fc
              ): FastCheck.Arbitrary<{
                section: ReadonlyArray<CompositionSection> | undefined
              }> =>
                fc.record({
                  section: fc.oneof(
                    {
                      depthSize: 'small',
                      depthIdentifier: 'id:CompositionSection',
                    },
                    fc.constant<ReadonlyArray<never>>([]),
                    fc.array<CompositionSection>(tie('self'), {
                      depthIdentifier: 'id:CompositionSection',
                      maxLength: 2,
                    })
                  ),
                })
            )(fc),
          })).self,
    },
  ],
  BackboneElementMixin,
  {
    ...fields,
    section: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<CompositionSection, CompositionSectionEncoded> =>
              CompositionSection
          )
        )
      )
    ),
  }
) {}
