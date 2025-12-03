"use client";

import { Questionnaire, QuestionnaireResponseId } from "assessmentis-domain";
import { QuestionnaireResponse } from "assessmentis-domain";
import { Link } from "react-router";

const QuestionnaireResponseList =
  ({
    deleteQuestionnaireResponse,
    questionnaireResponses,
  }: {
    deleteQuestionnaireResponse: (id: QuestionnaireResponseId | undefined) => Promise<unknown>;
    questionnaireResponses: ( {
      data: QuestionnaireResponse & { _questionnaire: Questionnaire | undefined},
      loading: boolean
    })[];
  }) => {
    return (
      <li>
        {questionnaireResponses.map(({ data: { _questionnaire: questionnaire, id, meta }, loading}) => (
          <ul key={id}>
              <button 
                onClick={() => deleteQuestionnaireResponse(id)} 
                style={{border: 'none'}}
              >
                ❌
              </button>
              <Link to={`/QuestionnaireResponse/${id}`} className="body-3">
                {questionnaire?.title ?? id} {meta?.lastUpdated}
              </Link>
          </ul>
        ))}
      </li>
    );
  };
export default QuestionnaireResponseList;
