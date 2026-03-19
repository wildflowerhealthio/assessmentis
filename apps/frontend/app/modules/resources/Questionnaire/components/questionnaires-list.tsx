'use client'

import type { Questionnaire } from '@assessmentis/clinical-domain'

export const QuestionnairesList = ({
  questionnaires,
  deleteQuestionnaire,
}: {
  questionnaires: { data: Questionnaire; loading: boolean }[]
  deleteQuestionnaire: (id: string | undefined) => Promise<void>
}): React.JSX.Element => (
  <ul>
    {questionnaires.map(({ data: { title, url, status }, loading }) => (
      <li key={url?.toString()} style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}>
        <button onClick={() => deleteQuestionnaire(url?.toString())} style={{ border: 'none' }}>
          ❌
        </button>
        {title ?? url?.toString()} ({status})
      </li>
    ))}
  </ul>
)
