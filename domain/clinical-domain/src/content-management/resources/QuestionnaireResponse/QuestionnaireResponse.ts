import { DateTime, Schema, Option, Data } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../../data-types/base/DomainResource'
import type {
  Identifier,
  Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../../data-types/complex/IdentifierAndReference'
import type { QuestionnaireResponseItem } from './QuestionnaireResponseItem'
import {
  allQuestionnaireResponseItems,
  QuestionnaireResponseItemFromFhirR4,
} from './QuestionnaireResponseItem'
import { QuestionnaireId } from '../Questionnaire/Questionnaire'
import { getAnsweredAt } from '../../extensions/QuestionnaireItemAnsweredAt'

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
export interface QuestionnaireResponse extends DomainResource<QuestionnaireResponseId> {
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

export const QuestionnaireResponse = {
  make: Data.case<QuestionnaireResponse>(),
}

export const QuestionnaireResponseFromFhirR4: Schema.Schema<
  QuestionnaireResponse,
  fhir.QuestionnaireResponse,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(QuestionnaireResponseId),
  Schema.Struct({
    resourceType: Schema.Literal('QuestionnaireResponse'),
    author: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    authored: Schema.optional(Schema.String),
    basedOn: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    encounter: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    identifier: Schema.optional(Schema.suspend(() => IdentifierFromFhirR4)),
    item: Schema.optional(Schema.mutable(Schema.Array(QuestionnaireResponseItemFromFhirR4))),
    partOf: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    questionnaire: Schema.optional(
      Schema.Union(Schema.String, QuestionnaireId)
    ),
    source: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    status: QuestionnaireResponseStatus,
    subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)

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
