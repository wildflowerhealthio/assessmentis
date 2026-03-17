import { DateTime, Option, Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { Questionnaire } from '../Questionnaire/Questionnaire'
import type { QuestionnaireItemLink } from '../Questionnaire/QuestionnaireItemLink'
import { QuestionnaireItemAnsweredAtExtension } from '../Questionnaire/QuestionnaireItemAnsweredAt'
import { QuestionnaireResponseItem } from './QuestionnaireResponseItem'
import type { QuestionnaireResponseItemEncoded } from './QuestionnaireResponseItem'

const DomainType = 'QuestionnaireResponse' as const
type DomainType = typeof DomainType

/** FHIR R4 questionnaire response lifecycle status values. */
export const QuestionnaireResponseStatus = Schema.Enums({
  'in-progress': 'in-progress',
  completed: 'completed',
  amended: 'amended',
  'entered-in-error': 'entered-in-error',
  stopped: 'stopped',
} as const)

const fields = {
  author: Schema.optional(Schema.suspend(() => Reference)),
  authored: Schema.optional(Schema.String),
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  partOf: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  questionnaire: Schema.optional(Questionnaire.UrlSchema),
  source: Schema.optional(Schema.suspend(() => Reference)),
  status: QuestionnaireResponseStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link QuestionnaireResponse}, including recursive items. */
export interface QuestionnaireResponseEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {
  readonly item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
}

/**
 * A structured set of questions and their answers.
 */
export class QuestionnaireResponse extends MergeClasses<QuestionnaireResponse>(
  DomainType
)([], resourceMixin, fields, {
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          QuestionnaireResponseItem,
          QuestionnaireResponseItemEncoded
        > => QuestionnaireResponseItem
      )
    )
  ),
}) {
  /** Yields all nested {@link QuestionnaireResponseItem}s depth-first. */
  *deepQuestionnaireResponseItems(): Generator<QuestionnaireResponseItem> {
    for (const child of this.item ?? []) {
      yield child
      yield* child.deepQuestionnaireResponseItems()
    }
  }

  /** Returns a copy with the child item matching `linkId` replaced (or inserted) by applying `updater`. */
  withChildItem(
    linkId: typeof QuestionnaireItemLink.Type,
    updater: (prev: QuestionnaireResponseItem) => QuestionnaireResponseItem
  ): QuestionnaireResponse {
    const existing =
      this.item?.find((i) => i.linkId === linkId) ??
      QuestionnaireResponseItem.make({ linkId })
    const updated = updater(existing)
    return QuestionnaireResponse.make({
      ...this,
      item: [...(this.item?.filter((i) => i.linkId !== linkId) ?? []), updated],
    })
  }

  /**
   * Finds the first item whose answer timestamp falls after `time`.
   *
   * @param time - The cutoff time; items answered at or before this are excluded
   * @returns The earliest-answered item after `time`, or `undefined` if none qualify
   */
  firstItemAnsweredAfter(
    time: DateTime.Utc
  ): QuestionnaireResponseItem | undefined {
    if (!this.item) return undefined

    const allItems = [...this.deepQuestionnaireResponseItems()]
    if (!allItems.length) return undefined

    const isInPast = DateTime.lessThan(time)

    return allItems.reduce(
      (
        proposedNextItem: QuestionnaireResponseItem | undefined,
        candidate: QuestionnaireResponseItem
      ) => {
        const candidateAnswerTimeInFuture = Option.fromNullable(
          candidate.answer?.[0]
        ).pipe(
          Option.flatMap((candidateAnswer) =>
            Option.fromNullable(
              QuestionnaireItemAnsweredAtExtension.get(candidateAnswer)
            )
          ),
          Option.flatMap((candidateAnswerTime) =>
            isInPast(candidateAnswerTime)
              ? Option.none()
              : Option.some(candidateAnswerTime)
          ),
          Option.getOrElse(() => undefined)
        )

        if (candidateAnswerTimeInFuture === undefined) return proposedNextItem

        const proposedAnswerTime = Option.fromNullable(
          proposedNextItem?.answer?.[0]
        ).pipe(
          Option.flatMap((proposedAnswer) =>
            Option.fromNullable(
              QuestionnaireItemAnsweredAtExtension.get(proposedAnswer)
            )
          ),
          Option.getOrElse(() => undefined)
        )

        if (proposedAnswerTime == undefined) return candidate

        const wasAnsweredBeforeProposed = DateTime.lessThan(proposedAnswerTime)

        if (wasAnsweredBeforeProposed(candidateAnswerTimeInFuture)) {
          return candidate
        }

        return proposedNextItem
      },
      undefined
    )
  }
}
