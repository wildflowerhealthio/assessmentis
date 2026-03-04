import { Effect, Either, Option, Stream, type Schema, type Scope } from 'effect'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import type {
  ClinicalDataRepositoryErrors,
  Schemas,
} from '@assessmentis/clinical-domain'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { NotFoundError } from '@assessmentis/ontology'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { useEitherStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../../../layers/PlatformContext'
import { FormPage } from '../../common/components/FormPage/FormPage'
import { Generic404Content } from '../../common/components/Generic404Content'
import { useBreadcrumbs } from '../../global/components/BreadcrumbProvider/useBreadcrumbs'
import type { ResourcePagesConfig } from './resourcePagesConfigType'

export interface EditResourcePageProps {
  params: { id: string }
}

type WithUrl<T extends { url?: ReadonlyUrl | undefined }> = T & {
  url: NonNullable<T['url']>
}

export function makeEditResourcePage<
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  TFormSchema extends Schema.Schema.AnyNoContext,
>(config: ResourcePagesConfig<TResource, TFormSchema>) {
  const FormComponent = config.FormComponent

  const EditResourcePage = ({
    params: { id: rawResourceId },
  }: EditResourcePageProps) => {
    const resourceUrl = useMemo(
      () => config.decodeUrl(rawResourceId),
      [rawResourceId]
    )

    const { clinicalDataRepositoryService } = usePlatformContext()

    const resourceStream = useMemo(() => {
      if (Option.isNone(resourceUrl)) {
        return Stream.succeed(
          Either.left(
            new NotFoundError({
              resourceType: config.resourceType,
              params: { url: rawResourceId },
            })
          )
        ) as Stream.Stream<
          Either.Either<
            TResource,
            | NoSelectedOrgError
            | ClinicalDataRepositoryErrors
            | NotFoundError<string, { readonly url: string | ReadonlyUrl }>
          >,
          never,
          Scope.Scope
        >
      }
      const url = resourceUrl.value
      return clinicalDataRepositoryService
        .repositoryStream(config.resourceType)
        .pipe(StreamEither.mapEffect((repo) => repo.get(url)))
    }, [clinicalDataRepositoryService, rawResourceId, resourceUrl])

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
      if (!resource.url) return

      await Effect.runPromise(
        config
          .updateAction(resource.url, resource, formData)
          .pipe(
            Effect.provideService(
              ClinicalDataRepositoryService,
              clinicalDataRepositoryService
            )
          )
      )

      navigate(`/${config.resourceType}/${resource.url.toString()}`)
    }

    if (Option.isNone(resourceUrl)) {
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
