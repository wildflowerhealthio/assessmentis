import { DateTime, Schema, Option } from 'effect'
import { DomainResource } from '../../general-purpose/DomainResource'
import { Identifier } from '../../general-purpose/Identifier'
import { Reference } from '../../general-purpose/Reference'
import {
  allQuestionnaireResponseItems,
  QuestionnaireResponseItem,
} from './QuestionnaireResponseItem'
import { QuestionnaireId } from './Questionnaire'
import { getAnsweredAt } from '../extensions/QuestionnaireItemAnsweredAt'

export const QuestionnaireResponseId = Schema.UUID.pipe(
  Schema.brand('QuestionnaireResponseId')
)

export type QuestionnaireResponseId = typeof QuestionnaireResponseId.Type

export const QuestionnaireResponseStatus = Schema.Enums({
  'in-progress': 'in-progress',
  completed: 'completed',
  amended: 'amended',
  'entered-in-error': 'entered-in-error',
  stopped: 'stopped',
} as const)
/**
 * A structured set of questions and their answers. The questions are ordered and grouped into coherent subsets, corresponding to the structure of the grouping of the questionnaire being responded to.
 */
export const QuestionnaireResponse = Schema.Struct({
  ...DomainResource(QuestionnaireResponseId).fields,
  /** Resource Type Name (for serialization) */
  resourceType: Schema.Literal('QuestionnaireResponse'),
  /**
   * Mapping a subject's answers to multiple choice options and determining what to put in the textual answer is a matter of interpretation.  Authoring by device would indicate that some portion of the questionnaire had been auto-populated.
   */
  author: Schema.optional(Reference),
  /**
   * May be different from the lastUpdateTime of the resource itself, because that reflects when the data was known to the server, not when the data was captured.
   * This element is optional to allow for systems that might not know the value, however it SHOULD be populated if possible.
   */
  authored: Schema.optional(Schema.String),
  // _authored?: Element | undefined;
  /**
   * The order, proposal or plan that is fulfilled in whole or in part by this QuestionnaireResponse.  For example, a ServiceRequest seeking an intake assessment or a decision support recommendation to assess for post-partum depression.
   */
  basedOn: Schema.optional(Schema.Array(Reference)),

  /**
   * This will typically be the encounter the event occurred within, but some activities may be initiated prior to or after the official completion of an encounter but still be tied to the context of the encounter. A questionnaire that was initiated during an encounter but not fully completed during the encounter would still generally be associated with the encounter.
   */
  encounter: Schema.optional(Reference),
  /**
   * A business identifier assigned to a particular completed (or partially completed) questionnaire.
   */
  identifier: Schema.optional(Identifier),
  /**
   * Groups cannot have answers and therefore must nest directly within item. When dealing with questions, nesting must occur within each answer because some questions may have multiple answers (and the nesting occurs for each answer).
   */
  item: Schema.optional(Schema.Array(QuestionnaireResponseItem)),
  /**
   * Composition of questionnaire responses will be handled by the parent questionnaire having answers that reference the child questionnaire.  For relationships to referrals, and other types of requests, use basedOn.
   */
  partOf: Schema.optional(Schema.Array(Reference)),
  /**
   * If a QuestionnaireResponse references a Questionnaire, then the QuestionnaireResponse structure must be consistent with the Questionnaire (i.e. questions must be organized into the same groups, nested questions must still be nested, etc.).
   */
  questionnaire: Schema.optional(Schema.Union(Schema.String, QuestionnaireId)),
  // _questionnaire?: Element | undefined;
  /**
   * If not specified, no inference can be made about who provided the data.
   */
  source: Schema.optional(Reference),
  /**
   * This element is labeled as a modifier because the status contains codes that mark the resource as not currently valid.
   */
  status: QuestionnaireResponseStatus,
  // _status?: Element | undefined;
  /**
   * If the Questionnaire declared a subjectType, the resource pointed to by this element must be an instance of one of the listed types.
   */
  subject: Schema.optional(Reference),
})

export type QuestionnaireResponse = typeof QuestionnaireResponse.Type

export const firstItemAnsweredAfter = (
  questionnaireResponse: QuestionnaireResponse,
  time: DateTime.Utc
) => {
  if (!questionnaireResponse.item) return undefined

  const allItems = [
    ...allQuestionnaireResponseItems(questionnaireResponse.item),
  ]
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
          Option.fromNullable(getAnsweredAt(candidateAnswer))
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
          Option.fromNullable(getAnsweredAt(proposedAnswer))
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
