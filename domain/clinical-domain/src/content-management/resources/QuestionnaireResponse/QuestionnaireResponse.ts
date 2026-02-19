import { DateTime, pipe, Schema, Option } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../../ClinicalResourceBehaviour'
import { DomainResource } from '../../../data-types/base/DomainResource'
import {
  Identifier,
  Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import {
  allQuestionnaireResponseItems,
  QuestionnaireResponseItem,
} from './QuestionnaireResponseItem'
import { QuestionnaireId } from '../Questionnaire/Questionnaire'
import { getAnsweredAt } from '../../extensions/QuestionnaireItemAnsweredAt'
import { WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/QuestionnaireResponse'
)
type ResourceSymbol = typeof ResourceSymbol

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
 * A structured set of questions and their answers.
 */
export interface QuestionnaireResponse
  extends
    DomainResource<QuestionnaireResponseId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
  resourceType: 'QuestionnaireResponse'
  author?: Reference
  authored?: string
  basedOn?: Reference[]
  encounter?: Reference
  identifier?: Identifier
  item?: QuestionnaireResponseItem[]
  partOf?: Reference[]
  questionnaire?: string | typeof QuestionnaireId.Type
  source?: Reference
  status: typeof QuestionnaireResponseStatus.Type
  subject?: Reference
}

const QuestionnaireResponseSchema = pipe(
  DomainResource.Schema(QuestionnaireResponseId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('QuestionnaireResponse'),
      author: Schema.optional(Schema.suspend(() => Reference.Schema)),
      authored: Schema.optional(Schema.String),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      encounter: Schema.optional(Schema.suspend(() => Reference.Schema)),
      identifier: Schema.optional(Schema.suspend(() => Identifier.Schema)),
      item: Schema.optional(
        Schema.mutable(Schema.Array(QuestionnaireResponseItem.Schema))
      ),
      partOf: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      questionnaire: Schema.optional(
        Schema.Union(Schema.String, QuestionnaireId)
      ),
      source: Schema.optional(Schema.suspend(() => Reference.Schema)),
      status: QuestionnaireResponseStatus,
      subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
    })
  )
)

export const QuestionnaireResponse = Object.assign(
  ClinicalResourceBehaviourImpl<
    QuestionnaireResponse,
    Schema.Schema.Encoded<typeof QuestionnaireResponseSchema>
  >({
    ResourceSymbol,
    resourceType: 'QuestionnaireResponse',
    Schema: QuestionnaireResponseSchema,
  }),
  {
    firstItemAnsweredAfter: (
      questionnaireResponse: QuestionnaireResponse,
      time: DateTime.Utc
    ): QuestionnaireResponseItem | undefined => {
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

          const wasAnsweredBeforeProposed =
            DateTime.lessThan(proposedAnswerTime)

          if (wasAnsweredBeforeProposed(candidateAnswerTimeInFuture)) {
            return candidate
          }

          return proposedNextItem
        },
        undefined
      )
    },
  }
)
