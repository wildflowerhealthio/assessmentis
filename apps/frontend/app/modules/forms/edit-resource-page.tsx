import { Effect } from 'effect'
import { useMemo } from 'react'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { useHub } from '../../layers/use-hub'
import { useResourceSubscription } from '../../layers/use-resource-subscription'
import { assertBreadcrumbLabel } from '../../traits/BreadcrumbLabel/breadcrumb-label'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/breadcrumb-label'
import type { LabeledConstructor } from '../../traits/Labeled/labeled'
import { assertLink } from '../../traits/Link/link'
import type { LinkConstructor } from '../../traits/Link/link'
import type { BreadcrumbSegment } from '../Breadcrumbs/breadcrumb-context'
import { useBreadcrumbs } from '../Breadcrumbs/use-breadcrumbs'
import { FormPage } from '../common/components/FormPage/form-page'
import type { ResourceFormData, ResourceFormDataConstructor } from './resource-form-data'

export function EditResourcePage<
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
  url: rawUrl,
}: {
  klass: K
  Form: ResourceFormDataConstructor<K, TFormData, TFormDataEncoded>
  FormComponent: ComponentType<{
    onSubmit: (data: TFormData) => void | Promise<void>
    submitLabel: string
    initialValues: TFormDataEncoded | Promise<TFormDataEncoded>
  }>
  url: string
}): React.JSX.Element {
  const hub = useHub()
  const navigate = useNavigate()

  // UseResourceSubscription handles invalid URLs by emitting NotFoundError,
  // Which useEitherStream converts to a rejected promise for the error boundary.
  const resourceStream = useResourceSubscription(klass, rawUrl)
  const resourcePromise = useEitherStream(resourceStream)
  useBreadcrumbs(
    () =>
      [
        klass,
        resourcePromise.then((r) => {
          assertLink(r)
          assertBreadcrumbLabel(r)
          return { href: r.Link, label: r.BreadcrumbLabel }
        }) satisfies Promise<BreadcrumbSegment>,
        'Edit',
      ] as const,
    [klass, resourcePromise]
  )

  const initialValues = useMemo(
    () => resourcePromise.then((r) => Form.fromResource(r)),
    [resourcePromise, Form]
  )

  const handleSubmit = async (formData: TFormData): Promise<void> => {
    const resource = await resourcePromise

    if (!Resource.hasResourceUrl(resource)) {
      throw new Error(`Cannot update ${klass.DomainType} without a resource URL`)
    }

    const updated = formData.toUpdatePayload(resource)
    await Effect.runPromise(hub.update(klass, updated))
    assertLink(resource)
    void navigate(resource.Link)
  }

  return (
    <FormPage title={`Edit ${klass.Labeled.singularLabel}`}>
      <FormComponent onSubmit={handleSubmit} submitLabel="Save" initialValues={initialValues} />
    </FormPage>
  )
}
