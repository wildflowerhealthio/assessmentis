import { ScoringProps } from '@assessmentis/document-template-kinds/gad7-report'

export const Scoring = ({
  totalScore,
  subtitle,
  explainer,
  rangeExplanations,
}: ScoringProps) => {
  return (
    <div>
      <h2>{subtitle ?? 'Scoring GAD-7 Anxiety Severity'}</h2>
      Total Score: <strong>{totalScore}</strong>
      <p>
        {explainer ??
          `This is calculated by assigning scores of 0, 1, 2, and 3 to the response
        categories, respectively, of “not at all,” “several days,” “more than
        half the days,” and “nearly every day.” GAD-7 total score for the seven
        items ranges from 0 to 21.`}
        <ul>
          {(
            rangeExplanations ?? [
              '0-4: minimal anxiety',
              '5-9: mild anxiety',
              '10-14: moderate anxiety',
              '15-21: severe anxiety',
            ]
          ).map((explanation: string, index: number) => (
            <li key={index}>{explanation}</li>
          ))}
        </ul>
      </p>
    </div>
  )
}
