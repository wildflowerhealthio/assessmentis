import { Effect, type Schema } from 'effect'
import { useNavigate } from 'react-router'

import type { Schemas } from '@assessmentis/clinical-domain'

import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../../../layers/PlatformContext'
import { FormPage } from '../../common/components/FormPage/FormPage'
import { useBreadcrumbs } from '../../global/components/BreadcrumbProvider/useBreadcrumbs'
import type { ResourcePagesConfig } from './resourcePagesConfigType'

export const makeCreateResourcePage = <
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  TFormSchema extends Schema.Schema.AnyNoContext,
>(
  config: ResourcePagesConfig<TResource, TFormSchema>
) => {
  const FormComponent = config.FormComponent

  const Component = () => {
    const navigate = useNavigate()
    const { clinicalDataRepositoryService } = usePlatformContext()

    useBreadcrumbs([
      { label: config.pluralLabel, href: `/${config.resourceType}` },
      { label: 'New' },
    ])

    const handleSubmit = async (formData: Schema.Schema.Type<TFormSchema>) => {
      const created = await Effect.runPromise(
        config
          .createAction(formData)
          .pipe(
            Effect.provideService(
              ClinicalDataRepositoryService,
              clinicalDataRepositoryService
            )
          )
      )
      navigate(
        `/${config.resourceType}/${encodeURIComponent(created.url.toString())}`
      )
    }

    return (
      <FormPage title={`Create New ${config.singularLabel}`}>
        <FormComponent
          onSubmit={handleSubmit}
          submitLabel="Save"
          initialValues={config.defaultFormValues}
        />
      </FormPage>
    )
  }
  Component.displayName = `Create${config.singularLabel}Page`

  return Component
}
