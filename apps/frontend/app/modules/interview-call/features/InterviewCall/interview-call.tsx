'use client'

import type { FullEncounter } from '@/modules/interview-call/actions/get-full-encounter'
import QuestionnaireForm from '@/modules/resources/Questionnaire/features/QuestionnaireForm/questionnaire-form'

import SplitPane from '../../../common/components/SplitPane/split-pane'
import DailyCoCall from './daily-co-call'
import classes from './InterviewCall.module.css'

interface IProps {
  encounter: FullEncounter
}

const VIDEO_CALL_ROOM_SYSTEM = 'http://assessment.is/fhir/video-call-room-name'

function InterviewCall({ encounter }: IProps): React.JSX.Element {
  // Find the video room URL from resolved Location resources
  const videoRoomLocation = encounter.locations.find((loc) =>
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
            questionnaire={encounter.questionnaireResponses[0].questionnaire}
            questionnaireResponse={encounter.questionnaireResponses[0].questionnaireResponse}
          />
        </div>
      }
    />
  )
}

export default InterviewCall
