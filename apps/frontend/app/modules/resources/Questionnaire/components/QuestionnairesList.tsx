'use client'

import type {
  Questionnaire,
  QuestionnaireId,
} from '@assessmentis/clinical-domain/content-management'

export const QuestionnairesList = ({
  questionnaires,
  deleteQuestionnaire,
}: {
  questionnaires: { data: Questionnaire; loading: boolean }[]
  deleteQuestionnaire: (id: QuestionnaireId | undefined) => Promise<void>
}) => {
  return (
    <ul>
      {questionnaires.map(({ data: { title, id, status }, loading }) => (
        <li key={id} style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}>
          <button
            onClick={() => deleteQuestionnaire(id)}
            style={{ border: 'none' }}
          >
            ❌
          </button>
          {title ?? id} ({status})
        </li>
      ))}
    </ul>
  )
}
