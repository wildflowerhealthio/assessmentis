import { DateTime, Schema, Option } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { QuestionnaireResponseItem } from './QuestionnaireResponseItem'
import type { QuestionnaireResponseItemEncoded } from './QuestionnaireResponseItem'
import { QuestionnaireItemAnsweredAtExtension } from '../Questionnaire/QuestionnaireItemAnsweredAt'

const Key = 'QuestionnaireResponse' as const
type Key = typeof Key

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
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  identifier: Schema.optional(Schema.suspend(() => Identifier)),
  partOf: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  questionnaire: Schema.optional(Schema.String),
  source: Schema.optional(Schema.suspend(() => Reference)),
  status: QuestionnaireResponseStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface QuestionnaireResponseEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {
  readonly item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
}

/**
 * A structured set of questions and their answers.
 */
export class QuestionnaireResponse extends MergeClasses<QuestionnaireResponse>(
  Key
)(resourceMixin, fields, {
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
  *deepQuestionnaireResponseItems(): Generator<QuestionnaireResponseItem> {
    for (const child of this.item ?? []) {
      yield child
      yield* child.deepQuestionnaireResponseItems()
    }
  }

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
