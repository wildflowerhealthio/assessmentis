'use client'

import classes from './InterviewCall.module.css'

import type { FullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import QuestionnaireForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import SplitPane from '../../../common/components/SplitPane/SplitPane'
import DailyCoCall from './DailyCoCall'

interface IProps {
  encounter: FullEncounter
}

function InterviewCall({ encounter }: IProps) {
  const roomUrl = encounter.location?.[0].location?.identifier?.value

  return (
    <SplitPane
      className={classes.EncounterPage}
      left={<DailyCoCall roomUrl={roomUrl} className={classes.VideoZone} />}
      right={
        <div className={classes.ActionZone}>
          <QuestionnaireForm
            questionnaire={encounter.questionnaireResponses[0]._questionnaire}
            questionnaireResponse={encounter.questionnaireResponses[0]}
          />
        </div>
      }
    />
  )
}

export default InterviewCall
