import { Effect, Schema } from 'effect'
import {
  Code,
  CodeableConcept,
  Coding,
  Narrative,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import {
  QuestionnaireResponse,
  Composition,
  CompositionSection,
} from '@assessmentis/clinical-domain/content-management'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { makeScoringTable, ScoringTable } from './utility/scoringTable'
import { CompositionTemplate, CompositionSectionTemplate } from './templates'

const codeScores = {
  'LA6568-5': 0,
  'LA6569-3': 1,
  'LA6570-1': 2,
  'LA6571-9': 3,
} as Record<string, number | undefined>

const headerCodes: ReadonlyArray<Coding> = [
  {
    system: 'http://loinc.org',
    code: Code.make('LA6568-5'),
    display: 'Not at all',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6569-3'),
    display: 'Several days',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6570-1'),
    display: 'More than half the days',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6571-9'),
    display: 'Nearly every day',
  },
]

const makeGad7ScoringTable = makeScoringTable(
  gad7.item!.slice(0, 7),
  (item) => {
    const answer = item?.answer?.[0]
    const answerCode =
      answer && 'valueCoding' in answer ? answer.valueCoding?.code : undefined
    return answerCode && answerCode in codeScores
      ? codeScores[answerCode]
      : undefined
  },
  headerCodes
)

export const prepareGad7ReportData = (response: QuestionnaireResponse) => {
  if (!response.item) return Effect.fail('No items in QuestionnaireResponse')

  const scoreTableData = makeGad7ScoringTable(response.item.slice(0, 7))

  return scoreTableData.pipe(
    Effect.map((scoreTableData) =>
      Gad7ReportProps.make({ table: scoreTableData })
    )
  )
}

export const Gad7ReportProps = Schema.Struct({
  table: ScoringTable,
})

export type Gad7ReportProps = typeof Gad7ReportProps.Type

/**
 * Section template for individual GAD-7 question items
 */
export const gad7QuestionSectionTemplate: CompositionSectionTemplate<{
  questionText: string
  answerText: string
  score: number
}> = {
  name: 'gad7-question-section',
  title: 'GAD-7 Question Response',
  render: (props) =>
    Effect.succeed(
      Schema.decodeSync(CompositionSection)({
        title: props.questionText,
        code: CodeableConcept.make({
          coding: [
            Coding.make({
              system: 'http://loinc.org',
              code: Code.make('69737-5'),
              display: 'GAD-7 Question',
            }),
          ],
        }),
        text: Narrative.make({
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Question:</strong> ${props.questionText}</p><p><strong>Answer:</strong> ${props.answerText} (Score: ${props.score})</p></div>`,
        }),
      })
    ),
}

/**
 * Section template for GAD-7 summary/total score
 */
export const gad7SummarySectionTemplate: CompositionSectionTemplate<{
  totalScore: number
  interpretation: string
}> = {
  name: 'gad7-summary-section',
  title: 'GAD-7 Summary',
  render: (props) =>
    Effect.succeed(
      Schema.decodeSync(CompositionSection)({
        title: 'GAD-7 Total Score and Interpretation',
        code: CodeableConcept.make({
          coding: [
            Coding.make({
              system: 'http://loinc.org',
              code: Code.make('58628'),
              display: 'Generalized anxiety disorder 7 item total score',
            }),
          ],
        }),
        text: Narrative.make({
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><h3>Total Score: ${props.totalScore}</h3><p><strong>Interpretation:</strong> ${props.interpretation}</p><p>Scoring: 0-4: minimal anxiety, 5-9: mild anxiety, 10-14: moderate anxiety, 15-21: severe anxiety</p></div>`,
        }),
      })
    ),
}

/**
 * Composition template for GAD-7 assessment report
 */
export const gad7CompositionTemplate: CompositionTemplate<QuestionnaireResponse> =
  {
    name: 'gad7-composition',
    title: 'Generalized Anxiety Disorder (GAD-7) Assessment Report',
    render: (response) => {
      return Effect.gen(function* (_) {
        if (!response.item || response.item.length < 7) {
          return yield* _(
            Effect.fail('QuestionnaireResponse must have at least 7 items')
          )
        }

        // Get scoring table
        const scoreTable = yield* _(
          makeGad7ScoringTable(response.item.slice(0, 7))
        )

        // Create sections for each question
        const questionSections: CompositionSection[] = []
        for (const row of scoreTable.rows) {
          if (row.question && row.score !== undefined) {
            // Find the answer text from the data array
            const answerIndex = row.data.findIndex((d) => d !== '')
            const answerText =
              answerIndex >= 0
                ? scoreTable.dataHeaders[answerIndex]
                : 'No answer'
            const section = yield* _(
              gad7QuestionSectionTemplate.render({
                questionText: row.question,
                answerText,
                score: row.score,
              })
            )
            questionSections.push(section)
          }
        }

        // Create summary section
        const interpretation =
          scoreTable.totalScore <= 4
            ? 'Minimal anxiety'
            : scoreTable.totalScore <= 9
              ? 'Mild anxiety'
              : scoreTable.totalScore <= 14
                ? 'Moderate anxiety'
                : 'Severe anxiety'

        const summarySection = yield* _(
          gad7SummarySectionTemplate.render({
            totalScore: scoreTable.totalScore,
            interpretation,
          })
        )

        // Create the full composition
        // subject and author are required fields in Composition
        const subject =
          response.subject ||
          Reference.make({
            reference: 'Patient/unknown',
            display: 'Unknown Patient',
          })

        const author = response.author
          ? [response.author]
          : [
              Reference.make({
                reference: 'Practitioner/unknown',
                display: 'Unknown Author',
              }),
            ]

        const composition: Composition = Schema.decodeSync(Composition)({
          resourceType: 'Composition',
          status: 'final',
          type: CodeableConcept.make({
            coding: [
              Coding.make({
                system: 'http://loinc.org',
                code: Code.make('69737-5'),
                display: 'Generalized anxiety disorder 7 item (GAD-7)',
              }),
            ],
          }),
          subject,
          date: response.authored || new Date().toISOString(),
          author,
          title: 'Generalized Anxiety Disorder (GAD-7) Assessment Report',
          section: [summarySection, ...questionSections],
        })

        return composition
      })
    },
  }
