import { Match, Schema } from 'effect'
import { EncounterId } from '@assessmentis/clinical-domain/encounters'
import { getFullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'
import type { Route } from './+types/Encounter.$encounterId'
import { getRuntime } from '../clientRuntime'

const tryDecodeEncounterId = Schema.decodeOption(EncounterId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const encounterIdStr = params.encounterId
  const encounterIdMaybe = tryDecodeEncounterId(encounterIdStr)

  const runtime = await getRuntime()
  const encounter = await runtime.runPromise(getFullEncounter(encounterIdMaybe))

  return { encounter }
}

export default function EncounterPage({ loaderData }: Route.ComponentProps) {
  const { encounter } = loaderData

  return Match.value(encounter).pipe(
    Match.tag('Success', ({ data }) => (
      <InterviewCall encounterJson={data}></InterviewCall>
    )),
    Match.tag('NotFound', ({ encounterId }) =>
      encounterId == undefined ? (
        <>This is not a valid Encounter ID</>
      ) : (
        <>No Encounter Found for ID {encounterId}</>
      )
    ),
    Match.exhaustive
  )
}
