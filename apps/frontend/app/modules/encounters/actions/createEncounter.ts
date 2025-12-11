import { Effect, Schema } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
} from '@assessmentis/clinical-domain/video-calls'
import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import {
  EncounterRepository,
  Encounter,
} from '@assessmentis/clinical-domain/encounters'
import {
  NeedsAuthenticationError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/clinical-domain/errors'
import { Code } from '@assessmentis/clinical-domain/general-purpose'

export const CreateEncounterArg = Schema.extend(
  Schema.partial(Encounter),
  Schema.Struct({
    //....pipe(Schema.omit("encounterId")).fields,
    questionnaireResponses: Schema.Array(
      QuestionnaireResponse.pipe(Schema.pick('questionnaire'))
    ),
  })
)

export type CreateEncounterArg = typeof CreateEncounterArg.Type

export const CreateEncounterResponse = Schema.Struct({
  ...Encounter.fields,
  // videoCallRooms: Schema.Array(VideoCallRoom),
  questionnaireResponses: Schema.Array(QuestionnaireResponse),
})

export type CreateEncounterResponse = typeof CreateEncounterResponse.Type

export const createEncounter = (
  args: CreateEncounterArg
): Effect.Effect<
  CreateEncounterResponse,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalVideoCallServiceError
  | ExternalAssertionError,
  | EncounterRepository
  | QuestionnaireResponseRepository
  | ExternalVideoCallClient
> => {
  return Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const videoCalls = yield* ExternalVideoCallClient

    const externalVideoCallRoom = yield* videoCalls.createRoom({
      enableRecording: true,
    })

    const encounterData = {
      resourceType: 'Encounter' as const,
      class: {
        display: 'virtual',
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: Code.make('VR'),
      },
      location: [
        {
          location: {
            identifier: {
              system: 'http://assessment.is/fhir/video-call-room-name',
              value: externalVideoCallRoom.roomName,
            },
          },
        },
      ],
      status: 'planned',
      ...args,
    }

    const createdEncounter =
      yield* encounterRepository.createEncounter(encounterData)

    // const roomInsertsEffect = videoCallRepository.createVideoCallRooms([
    //   {
    //     encounterId: createdEncounter.id,
    //     externalVideoCallRoomId: externalVideoCallRoom.id,
    //     externalVideoCallRoomName: externalVideoCallRoom.roomName,
    //     url: externalVideoCallRoom.url,
    //   },
    // ]);

    const questionnaireResponsesEffect =
      questionnaireResponseRepository.createQuestionnaireResponses(
        args.questionnaireResponses.map((questionnaireResponse) => ({
          resourceType: 'QuestionnaireResponse',
          encounter: {
            reference: `Encounter/${createdEncounter.id}`,
          },
          ...questionnaireResponse,
          status: 'in-progress',
        }))
      )

    const [
      encounterRow,
      //rooms,
      questionnaireResponseRows,
    ] = yield* Effect.all([
      Effect.succeed(createdEncounter),
      // roomInsertsEffect,
      questionnaireResponsesEffect,
    ] as const)

    // const videoCallRooms: VideoCallRoom[] = rooms;
    const questionnaireResponses: ReadonlyArray<QuestionnaireResponse> =
      questionnaireResponseRows

    return {
      ...encounterRow,
      // videoCallRooms,
      questionnaireResponses,
    }
  })
}
