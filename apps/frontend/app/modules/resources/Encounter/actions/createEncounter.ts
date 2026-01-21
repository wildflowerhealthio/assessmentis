import { Effect, Schema } from 'effect'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  EncounterRepository,
  Encounter,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError, ExternalAssertionError } from '@assessmentis/ontology'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { AuthError, AuthzError } from '@assessmentis/platform-domain'

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
  UnhandledError | AuthError | AuthzError | ExternalAssertionError,
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
      resourceType: 'Encounter',
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
              value: externalVideoCallRoom.url,
            },
          },
        },
      ],
      status: 'planned',
      ...args,
    } as const

    const createdEncounter = yield* encounterRepository.create(encounterData)

    const questionnaireResponsesEffect =
      questionnaireResponseRepository.createMany(
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
