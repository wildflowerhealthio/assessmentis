import { Effect, Schema } from 'effect'

import {
  ClinicalDomainHub,
  Encounter,
  EncounterLocation,
  Location,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type {
  EncounterEncoded,
  QuestionnaireResponseEncoded,
} from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
  Identifier,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'

export const CreateEncounterArg: Schema.Schema<
  {
    encounter: Partial<Encounter>
    questionnaireResponses: ReadonlyArray<
      Pick<QuestionnaireResponse, 'questionnaire'>
    >
  },
  {
    encounter: Partial<EncounterEncoded>
    questionnaireResponses: ReadonlyArray<
      Pick<QuestionnaireResponseEncoded, 'questionnaire'>
    >
  },
  never
> = Schema.Struct({
  encounter: Schema.partial(Encounter),
  //....pipe(Schema.omit("encounterId")).fields,
  questionnaireResponses: Schema.Array(
    QuestionnaireResponse.pipe(Schema.pick('questionnaire'))
  ),
})

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
  ClinicalDomainHub
> => {
  return Effect.gen(function* () {
    const hub = yield* ClinicalDomainHub

    // TODO: replace with hubs
    const externalVideoCallRoom = { url: undefined }
    // const externalVideoCallRoom = yield* videoCalls.createRoom({
    //   enableRecording: true,
    // })

    // Create a standalone Location resource for the video room
    const videoRoomLocation = yield* hub.create(
      Location,
      Location.make({
        name: 'Video Room',
        identifier: [
          Identifier.make({
            system: 'http://assessment.is/fhir/video-call-room-name',
            value: externalVideoCallRoom.url,
          }),
        ],
        status: 'active',
        mode: 'instance',
      })
    )

    // Build location array with proper references
    const videoRoomEntry = EncounterLocation.make({
      location: Reference.make({
        reference: `Location/${videoRoomLocation.url.toString()}`,
      }),
      physicalType: CodeableConcept.make({
        coding: [
          Coding.make({
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: Code.make('vi'),
            display: 'Virtual',
          }),
        ],
      }),
    })

    const encounterData: Encounter = Encounter.make({
      class: Coding.make({
        display: 'virtual',
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: Code.make('VR'),
      }),
      status: 'planned',
      ...args.encounter,
      location: [videoRoomEntry],
    })

    const createdEncounter = yield* hub.create(Encounter, encounterData)

    const questionnaireResponseRows = yield* hub.createMany(
      QuestionnaireResponse,
      args.questionnaireResponses.map((questionnaireResponse) =>
        QuestionnaireResponse.make({
          encounter: Reference.make({
            reference: createdEncounter.url.toString(),
          }),
          ...questionnaireResponse,
          status: 'in-progress',
        })
      )
    )

    const questionnaireResponses: ReadonlyArray<QuestionnaireResponse> =
      questionnaireResponseRows

    return {
      ...createdEncounter,
      questionnaireResponses,
    }
  })
}
