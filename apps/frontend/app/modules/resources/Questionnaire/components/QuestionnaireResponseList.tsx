'use client'

import type {
  Questionnaire,
  QuestionnaireResponseId,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import { Link } from 'react-router'

const QuestionnaireResponseList = ({
  deleteQuestionnaireResponse,
  questionnaireResponses,
}: {
  deleteQuestionnaireResponse: (
    id: QuestionnaireResponseId | undefined
  ) => Promise<unknown>
  questionnaireResponses: {
    data: QuestionnaireResponse & { _questionnaire: Questionnaire | undefined }
    loading: boolean
  }[]
}) => {
  return (
    <li>
      {questionnaireResponses.map(
        ({ data: { _questionnaire: questionnaire, id, meta }, loading }) => (
          <ul key={id} style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}>
            <button
              onClick={() => deleteQuestionnaireResponse(id)}
              style={{ border: 'none' }}
            >
              ❌
            </button>
            <Link to={`/QuestionnaireResponse/${id}`} className="body-3">
              {questionnaire?.title ?? id}
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
