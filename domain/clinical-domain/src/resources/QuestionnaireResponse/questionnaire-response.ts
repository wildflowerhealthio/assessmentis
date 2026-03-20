import { DateTime, Option, Schema } from 'effect'

import { Search } from '@assessmentis/effectful-store'
import { AnnotateArrayWithArbitrary, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { Encounter } from '../Encounter/encounter'
import { Questionnaire } from '../Questionnaire/questionnaire'
import { QuestionnaireItemAnsweredAtExtension } from '../Questionnaire/questionnaire-item-answered-at'
import type { QuestionnaireItemLink } from '../Questionnaire/questionnaire-item-link'
import { QuestionnaireResponseItem } from './questionnaire-response-item'
import type { QuestionnaireResponseItemEncoded } from './questionnaire-response-item'

const DomainType = 'QuestionnaireResponse' as const
type DomainType = typeof DomainType

/** FHIR R4 questionnaire response lifecycle status values. */
export const QuestionnaireResponseStatus = Schema.Enums({
  amended: 'amended',
  completed: 'completed',
  'entered-in-error': 'entered-in-error',
  'in-progress': 'in-progress',
  stopped: 'stopped',
} as const)

const fields = {
  author: Schema.optional(Schema.suspend(() => Reference)),
  authored: Schema.optional(Schema.String),
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  partOf: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  questionnaire: Schema.optional(Questionnaire.UrlSchema),
  source: Schema.optional(Schema.suspend(() => Reference)),
  status: QuestionnaireResponseStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const QuestionnaireResponseResource = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link QuestionnaireResponse}, including recursive items. */
export interface QuestionnaireResponseEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {
  readonly item?: readonly QuestionnaireResponseItemEncoded[] | undefined
}

/**
 * A structured set of questions and their answers.
 */
export class QuestionnaireResponse extends QuestionnaireResponseResource.extend<QuestionnaireResponse>(
  DomainType
)({
  ...fields,
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<QuestionnaireResponseItem, QuestionnaireResponseItemEncoded> =>
          QuestionnaireResponseItem
      )
    )
  ),
}) {
  static readonly DomainType = QuestionnaireResponseResource.DomainType
  static readonly UrlSchema = QuestionnaireResponseResource.UrlSchema
  /** Searchable fields for this resource and their allowed condition types. */
  static readonly SearchSchema = {
    encounter: Search.field(Encounter.UrlSchema, ['Exactly']),
  } as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(QuestionnaireResponse, this);

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
      this.item?.find((i) => i.linkId === linkId) ?? QuestionnaireResponseItem.make({ linkId })
    const updated = updater(existing)
    return this.cloneWith({
      item: [...(this.item?.filter((i) => i.linkId !== linkId) ?? []), updated],
    })
  }

  /**
   * Finds the first item whose answer timestamp falls after `time`.
   *
   * @param time - The cutoff time; items answered at or before this are excluded
   * @returns The earliest-answered item after `time`, or `undefined` if none qualify
   */
  firstItemAnsweredAfter(time: DateTime.Utc): QuestionnaireResponseItem | null {
    if (!this.item) {
      return null
    }

    const allItems = [...this.deepQuestionnaireResponseItems()]
    if (allItems.length === 0) {
      return null
    }

    const isInPast = DateTime.lessThan(time)

    return allItems.reduce<QuestionnaireResponseItem | null>(
      (
        proposedNextItem: QuestionnaireResponseItem | null,
        candidate: QuestionnaireResponseItem
      ) => {
        const candidateAnswerTimeInFuture = Option.fromNullable(candidate.answer?.[0]).pipe(
          Option.flatMap((candidateAnswer) =>
            Option.fromNullable(QuestionnaireItemAnsweredAtExtension.get(candidateAnswer))
          ),
          Option.flatMap((candidateAnswerTime) => {
            if (isInPast(candidateAnswerTime)) {
              // Candidate is answered before the cutoff time, so ignore it
              return Option.none()
            } else {
              // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some uses the function as a value
              return Option.some(candidateAnswerTime)
            }
          }),
          Option.getOrNull
        )

        if (candidateAnswerTimeInFuture === null) {
          return proposedNextItem
        }

        const proposedAnswerTime = Option.fromNullable(proposedNextItem?.answer?.[0]).pipe(
          Option.flatMap((proposedAnswer) =>
            Option.fromNullable(QuestionnaireItemAnsweredAtExtension.get(proposedAnswer))
          ),
          Option.getOrNull
        )

        if (proposedAnswerTime === null) {
          return candidate
        }

        const wasAnsweredBeforeProposed = DateTime.lessThan(proposedAnswerTime)

        if (wasAnsweredBeforeProposed(candidateAnswerTimeInFuture)) {
          return candidate
        }

        return proposedNextItem
      },
      null
    )
  }
}
