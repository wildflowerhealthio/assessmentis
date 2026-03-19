import { Effect } from 'effect'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'

import { useHub } from '../../layers/use-hub'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/breadcrumb-label'
import type { LabeledConstructor } from '../../traits/Labeled/labeled'
import { assertLink } from '../../traits/Link/link'
import type { LinkConstructor } from '../../traits/Link/link'
import { useBreadcrumbs } from '../Breadcrumbs/use-breadcrumbs'
import { FormPage } from '../common/components/FormPage/form-page'
import type { ResourceFormData, ResourceFormDataConstructor } from './resource-form-data'

export function CreateResourcePage<
  K extends ClinicalDomainClasses &
    LabeledConstructor &
    BreadcrumbLabelConstructor &
    LinkConstructor,
  TFormData extends ResourceFormData<K>,
  TFormDataEncoded,
>({
  klass,
  Form,
  FormComponent,
}: {
  klass: K
  Form: ResourceFormDataConstructor<K, TFormData, TFormDataEncoded>
  FormComponent: ComponentType<{
    onSubmit: (data: TFormData) => void | Promise<void>
    submitLabel: string
    initialValues: TFormDataEncoded | Promise<TFormDataEncoded>
  }>
}): React.JSX.Element {
  const navigate = useNavigate()
  const hub = useHub()

  useBreadcrumbs(() => [klass, 'New'], [klass])

  const handleSubmit = async (formData: TFormData): Promise<void> => {
    const domainData = formData.toCreatePayload()
    const created = await Effect.runPromise(hub.create(klass, domainData))
    assertLink(created)
    void navigate(created.Link)
  }

  return (
    <FormPage title={`Create New ${klass.Labeled.singularLabel}`}>
      <FormComponent
        onSubmit={handleSubmit}
        submitLabel="Save"
        initialValues={Form.defaultFormValues}
      />
    </FormPage>
  )
}
