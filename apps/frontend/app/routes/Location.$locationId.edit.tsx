import { Effect, Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { LocationForm } from 'app/modules/resources/Location/components/LocationForm'
import { updateLocation } from 'app/modules/resources/Location/actions/updateLocation'
import { LocationFormData } from 'app/modules/resources/Location/schemas/LocationFormSchema'
import { LocationId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Location.$locationId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getLocationDisplayName } from '../modules/resources/Location/utils/locationDisplay'
import { useMemo } from 'react'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const tryDecodeLocationId = Schema.decodeOption(LocationId)

export default function EditLocationPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const locationStream = useMemo(() => {
    const locationIdMaybe = tryDecodeLocationId(params.locationId)

    return Option.match(locationIdMaybe, {
      onSome: (locationId) =>
        clinicalDataRepositoryService.stream.Location.pipe(
          StreamEither.mapEffect((repo) => repo.get(locationId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Location ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.locationId])

  const locationPromise = useEitherStream(locationStream)

  const navigate = useNavigate()

  const breadcrumbs = useMemo(
    () => [
      { label: 'Locations', href: '/Location' },
      locationPromise.then((location) => ({
        label: getLocationDisplayName(location),
        href: `/Location/${params.locationId}`,
      })),
      { label: 'Edit' },
    ],
    [locationPromise, params.locationId]
  )

  useBreadcrumbs(breadcrumbs)

  const initialValues: Promise<LocationFormData> = useMemo(
    () =>
      locationPromise.then((location) => ({
        name: location.name ?? '',
        description: location.description ?? undefined,
        status: location.status ?? undefined,
        mode: location.mode ?? undefined,
        identifierSystem: location.identifier?.[0]?.system ?? undefined,
        identifierValue: location.identifier?.[0]?.value ?? undefined,
      })),
    [locationPromise]
  )

  const handleSubmit = async (formData: LocationFormData) => {
    const location = await locationPromise

    await Effect.runPromise(
      updateLocation(location.id, location, formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )

    navigate(`/Location/${location.id}`)
  }

  return (
    <FormPage title="Edit Location">
      <LocationForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
