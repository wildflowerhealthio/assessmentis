import { Effect } from 'effect'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'

import { useHub } from '../../layers/useHub'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { LabeledConstructor } from '../../traits/Labeled/Labeled'
import { assertLink, type LinkConstructor } from '../../traits/Link/Link'
import { useBreadcrumbs } from '../Breadcrumbs/useBreadcrumbs'
import { FormPage } from '../common/components/FormPage/FormPage'
import type {
  ResourceFormData,
  ResourceFormDataConstructor,
} from './ResourceFormData'

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
}) {
  const navigate = useNavigate()
  const hub = useHub()

  useBreadcrumbs(() => [klass, 'New'], [klass])

  const handleSubmit = async (formData: TFormData) => {
    const domainData = formData.toCreatePayload()
    const created = await Effect.runPromise(hub.create(klass, domainData))
    assertLink(created)
    navigate(created.Link)
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
