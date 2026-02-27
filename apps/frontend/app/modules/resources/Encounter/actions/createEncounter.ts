import { Effect, Schema } from 'effect'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import {
  Encounter,
  Location,
  QuestionnaireResponse,
  isVirtualLocation,
} from '@assessmentis/clinical-domain'
import {
  EncounterRepository,
  LocationRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/repositories'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import {
  Code,
  CodeableConcept,
  Coding,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'

export const CreateEncounterArg = Schema.extend(
  Schema.mutable(Schema.partial(Encounter)),
  Schema.mutable(
    Schema.Struct({
      //....pipe(Schema.omit("encounterId")).fields,
      questionnaireResponses: Schema.mutable(
        Schema.Array(QuestionnaireResponse.pipe(Schema.pick('questionnaire')))
      ),
    })
  )
)

export type CreateEncounterArg = typeof CreateEncounterArg.Type

export const CreateEncounterResponse = Schema.extend(
  Encounter,
  Schema.Struct({
    // videoCallRooms: Schema.Array(VideoCallRoom),
    questionnaireResponses: Schema.Array(QuestionnaireResponse),
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
    const videoRoomLocation = yield* locationRepository.create(
      Location.make({
        name: 'Video Room',
        identifier: [
          IdentifierAndReference.Identifier.make({
            system: 'http://assessment.is/fhir/video-call-room-name',
            value: externalVideoCallRoom.url,
          }),
        ],
        status: 'active',
        mode: 'instance',
      })
    )

    // Build location array with proper references
    const videoRoomEntry: NonNullable<Encounter['location']>[number] = {
      location: IdentifierAndReference.Reference.make({
        reference: `Location/${videoRoomLocation.url.toString()}`,
      }),
      physicalType: CodeableConcept.make({
        coding: [
          Coding.Coding.make({
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: Code.make('vi'),
            display: 'Virtual',
          }),
        ],
      }),
    }

    // Add user-selected physical location if provided
    const userLocationEntries: NonNullable<Encounter['location']>[number][] = (
      args.location ?? []
    ).filter((l) => !isVirtualLocation(l))

    const encounterData: Encounter = Encounter.make({
      class: Coding.Coding.make({
        display: 'virtual',
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: Code.make('VR'),
      }),
      status: 'planned',
      ...args,
      location: [videoRoomEntry, ...userLocationEntries],
    })

    const createdEncounter = yield* encounterRepository.create(encounterData)

    const questionnaireResponsesEffect =
      questionnaireResponseRepository.createMany(
        args.questionnaireResponses.map((questionnaireResponse) =>
          QuestionnaireResponse.make({
            encounter: IdentifierAndReference.Reference.make({
              reference: `Encounter/${createdEncounter.url.toString()}`,
            }),
            ...questionnaireResponse,
            status: 'in-progress',
          })
        )
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
