'use client'

import type {
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import { Link } from 'react-router'

const QuestionnaireResponseList = ({
  deleteQuestionnaireResponse,
  questionnaireResponses,
}: {
  deleteQuestionnaireResponse: (
    id: string | undefined
  ) => Promise<unknown>
  questionnaireResponses: {
    data: QuestionnaireResponse & { _questionnaire: Questionnaire | undefined }
    loading: boolean
  }[]
}) => {
  return (
    <li>
      {questionnaireResponses.map(
        ({ data: { _questionnaire: questionnaire, url, meta }, loading }) => (
          <ul key={url?.toString()} style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}>
            <button
              onClick={() => deleteQuestionnaireResponse(url?.toString())}
              style={{ border: 'none' }}
            >
              ❌
            </button>
            <Link to={`/QuestionnaireResponse/${url?.toString() ?? ''}`} className="body-3">
              {questionnaire?.title ?? url?.toString()}
              {meta?.lastUpdated && (
                <span
                  style={{
                    color: 'var(--neutral-9)',
                    fontSize: '0.875em',
                    marginLeft: 'var(--space-2)',
                  }}
                >
                  (Updated:{' '}
                  {new Date(meta.lastUpdated.epochMillis).toLocaleDateString()})
                </span>
              )}
            </Link>
          </ul>
        )
      )}
    </li>
  )
}
export default QuestionnaireResponseList
