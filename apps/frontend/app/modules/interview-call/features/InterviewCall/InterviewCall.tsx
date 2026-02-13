'use client'

import classes from './InterviewCall.module.css'

import type { FullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import QuestionnaireForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import SplitPane from '../../../common/components/SplitPane/SplitPane'
import DailyCoCall from './DailyCoCall'

interface IProps {
  encounter: FullEncounter
}

const VIDEO_CALL_ROOM_SYSTEM = 'http://assessment.is/fhir/video-call-room-name'

function InterviewCall({ encounter }: IProps) {
  // Find the video room URL from resolved Location resources
  const videoRoomLocation = encounter._locations.find((loc) =>
    loc.identifier?.some((id) => id.system === VIDEO_CALL_ROOM_SYSTEM)
  )
  const roomUrl = videoRoomLocation?.identifier?.find(
    (id) => id.system === VIDEO_CALL_ROOM_SYSTEM
  )?.value

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
