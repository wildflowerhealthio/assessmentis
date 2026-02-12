import type { Schema, Scope } from 'effect'
import { Either, Option, Stream } from 'effect'
import { Effect } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { useNavigate } from 'react-router'
import { useEitherStream } from '@assessmentis/react-util'
import { FormPage } from '../../common/components/FormPage/FormPage'
import { Generic404Content } from '../../common/components/Generic404Content'
import { useBreadcrumbs } from '../../global/components/BreadcrumbProvider/useBreadcrumbs'
import { useMemo } from 'react'
import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../../../layers/PlatformContext'
import type { ResourcePagesConfig } from './resourcePagesConfigType'
import { NotFoundError } from '@assessmentis/ontology'
import type {
  ClinicalDataRepositoryErrorsWithNotFound,
  Schemas,
} from '@assessmentis/clinical-domain'
import type { WithId } from '@assessmentis/clinical-domain/data-types'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'

export interface EditResourcePageProps {
  params: { id: string }
}

export function makeEditResourcePage<
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  TFormSchema extends Schema.Schema.AnyNoContext,
>(config: ResourcePagesConfig<TResource, TFormSchema>) {
  const FormComponent = config.FormComponent

  const EditResourcePage = ({
    params: { id: rawResourceId },
  }: EditResourcePageProps) => {
    const resourceId = useMemo(
      () => config.decodeId(rawResourceId),
      [rawResourceId]
    )

    const { clinicalDataRepositoryService } = usePlatformContext()

    const resourceStream = useMemo(
      () =>
        Option.match<
          NonNullable<TResource['id']>,
          Stream.Stream<
            Either.Either<
              WithId<TResource>,
              | NoSelectedOrgError
              | ClinicalDataRepositoryErrorsWithNotFound<TResource>
            >,
            never,
            Scope.Scope
          >
        >(resourceId, {
          onNone: () =>
            Stream.succeed(
              Either.left(
                new NotFoundError({
                  resourceType: config.resourceType,
                  params: { id: rawResourceId as NonNullable<TResource['id']> },
                })
              )
            ),
          onSome: (id) =>
            clinicalDataRepositoryService
              .repositoryStream(config.resourceType)
              .pipe(StreamEither.mapEffect((repo) => repo.get(id))),
        }),
      [clinicalDataRepositoryService, rawResourceId, resourceId]
    )

    const resourcePromise = useEitherStream(resourceStream)

    const navigate = useNavigate()

    const breadcrumbs = useMemo(
      () => [
        { label: config.pluralLabel, href: `/${config.resourceType}` },
        resourcePromise.then((r) => ({
          label: config.getDisplayName(r),
          href: `/${config.resourceType}/${rawResourceId}`,
        })),
        { label: 'Edit' },
      ],
      [resourcePromise, rawResourceId]
    )
    useBreadcrumbs(breadcrumbs)

    const initialValues = useMemo(
      () =>
        resourcePromise.then((resource) => config.extractFormValues(resource)),
      [resourcePromise]
    )

    const handleSubmit = async (formData: Schema.Schema.Type<TFormSchema>) => {
      const resource = await resourcePromise

      await Effect.runPromise(
        config
          .updateAction(resource.id, resource, formData)
          .pipe(
            Effect.provideService(
              ClinicalDataRepositoryService,
              clinicalDataRepositoryService
            )
          )
      )

      navigate(`/${config.resourceType}/${resource.id}`)
    }

    if (Option.isNone(resourceId)) {
      return <Generic404Content resourceType={config.singularLabel} />
    }

    return (
      <FormPage title={`Edit ${config.singularLabel}`}>
        <FormComponent
          onSubmit={handleSubmit}
          submitLabel="Save"
          initialValues={initialValues}
        />
      </FormPage>
    )
  }

  EditResourcePage.displayName = `${config.resourceType}EditPage`

  return EditResourcePage
}
