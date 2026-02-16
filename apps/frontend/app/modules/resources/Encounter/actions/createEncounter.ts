import { Effect, Schema } from 'effect'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import type {
  EncounterLocation,
  Encounter,
} from '@assessmentis/clinical-domain/administration'
import type { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import {
  QuestionnaireResponseFromFhirR4,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  EncounterRepository,
  LocationRepository,
  Location,
  EncounterFromFhirR4,
} from '@assessmentis/clinical-domain/administration'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import { Code } from '@assessmentis/clinical-domain/data-types'

export const CreateEncounterArg = Schema.extend(
  Schema.mutable(Schema.partial(EncounterFromFhirR4)),
  Schema.mutable(
    Schema.Struct({
      //....pipe(Schema.omit("encounterId")).fields,
      questionnaireResponses: Schema.mutable(
        Schema.Array(
          QuestionnaireResponseFromFhirR4.pipe(Schema.pick('questionnaire'))
        )
      ),
    })
  )
)

export type CreateEncounterArg = typeof CreateEncounterArg.Type

export const CreateEncounterResponse = Schema.extend(
  EncounterFromFhirR4,
  Schema.Struct({
    // videoCallRooms: Schema.Array(VideoCallRoom),
    questionnaireResponses: Schema.Array(QuestionnaireResponseFromFhirR4),
  })
)
export type CreateEncounterResponse = typeof CreateEncounterResponse.Type

export const createEncounter = (
  args: CreateEncounterArg
): Effect.Effect<
  CreateEncounterResponse,
  UnhandledError | AuthError | AuthzError | ExternalAssertionError,
  | EncounterRepository
  | QuestionnaireResponseRepository
  | VideoCallClient
  | LocationRepository
> => {
  return Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const locationRepository = yield* LocationRepository
    const videoCalls = yield* VideoCallClient

    const externalVideoCallRoom = yield* videoCalls.createRoom({
      enableRecording: true,
    })

    // Create a standalone Location resource for the video room
    const videoRoomLocation = yield* locationRepository.create({
      resourceType: 'Location',
      name: 'Video Room',
      identifier: [
        {
          system: 'http://assessment.is/fhir/video-call-room-name',
          value: externalVideoCallRoom.url,
        },
      ],
      status: 'active',
      mode: 'instance',
    })

    // Build location array with proper references
    const videoRoomEntry: EncounterLocation = {
      location: { reference: `Location/${videoRoomLocation.id}` },
      physicalType: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: Code.make('vi'),
            display: 'Virtual',
          },
        ],
      },
    }

    // Add user-selected physical location if provided
    const userLocationEntries: EncounterLocation[] = (
      args.location ?? []
    ).filter((l) => !Location.isVirtualLocation(l))

    const encounterData: Encounter = {
      resourceType: 'Encounter',
      class: {
        display: 'virtual',
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: Code.make('VR'),
      },
      status: 'planned',
      ...args,
      location: [videoRoomEntry, ...userLocationEntries],
    }

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
