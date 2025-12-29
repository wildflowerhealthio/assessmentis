import { Effect, Option, Schema } from 'effect'
import {
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Practitioner.$practitionerId._index'
import { getRuntime } from '../clientRuntime'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getPractitionerDisplayName,
  formatPractitionerDemographics,
} from '../modules/resources/Practitioner/utils/practitionerDisplay'
import { PractitionerQualifications } from '../modules/resources/Practitioner/components/PractitionerQualifications/PractitionerQualifications'
import { PractitionerContactInfo } from '../modules/resources/Practitioner/components/PractitionerContactInfo/PractitionerContactInfo'
import { PractitionerAddresses } from '../modules/resources/Practitioner/components/PractitionerAddresses/PractitionerAddresses'
import { PractitionerLanguages } from '../modules/resources/Practitioner/components/PractitionerLanguages/PractitionerLanguages'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

  const practitioner = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PractitionerRepository

      const practitionerId = yield* practitionerIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new UnhandledError({ cause: 'Practitioner ID not found' })
          )
        )
      )

      return yield* repository.get(practitionerId)
    })
  )

  return { practitioner }
}

export default function PractitionerDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { practitioner } = loaderData
  const displayName = getPractitionerDisplayName(practitioner)

  return (
    <ResourceDetailPage
      backTo="/Practitioner"
      backLabel="← Back to Practitioners"
      editTo={`/Practitioner/${practitioner.id}/edit`}
      title={displayName}
      subtitle={`Practitioner ID: ${practitioner.id}`}
      sections={[
        {
          id: 'demographics',
          title: 'Demographics',
          content: (
            <DetailGrid items={formatPractitionerDemographics(practitioner)} />
          ),
        },
        {
          id: 'qualifications',
          title: 'Qualifications',
          content: <PractitionerQualifications practitioner={practitioner} />,
          hidden:
            !practitioner.qualification ||
            practitioner.qualification.length === 0,
        },
        {
          id: 'contact',
          title: 'Contact Information',
          content: <PractitionerContactInfo practitioner={practitioner} />,
          hidden: !practitioner.telecom || practitioner.telecom.length === 0,
        },
        {
          id: 'addresses',
          title: 'Addresses',
          content: <PractitionerAddresses practitioner={practitioner} />,
          hidden: !practitioner.address || practitioner.address.length === 0,
        },
        {
          id: 'languages',
          title: 'Languages',
          content: <PractitionerLanguages practitioner={practitioner} />,
          hidden:
            !practitioner.communication ||
            practitioner.communication.length === 0,
        },
      ]}
      debugData={practitioner}
    />
  )
}
