import { Effect } from 'effect'
import { useMemo } from 'react'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { useHub } from '../../layers/useHub'
import { useResourceSubscription } from '../../layers/useResourceSubscription'
import { assertBreadcrumbLabel } from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { LabeledConstructor } from '../../traits/Labeled/Labeled'
import { assertLink } from '../../traits/Link/Link'
import type { LinkConstructor } from '../../traits/Link/Link'
import type { BreadcrumbSegment } from '../Breadcrumbs/BreadcrumbContext'
import { useBreadcrumbs } from '../Breadcrumbs/useBreadcrumbs'
import { FormPage } from '../common/components/FormPage/FormPage'
import type {
  ResourceFormData,
  ResourceFormDataConstructor,
} from './ResourceFormData'

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
}) {
  const hub = useHub()
  const navigate = useNavigate()

  // useResourceSubscription handles invalid URLs by emitting NotFoundError,
  // which useEitherStream converts to a rejected promise for the error boundary.
  const resourceStream = useResourceSubscription(klass, rawUrl)
  const resourcePromise = useEitherStream(resourceStream)
  useBreadcrumbs(
    () =>
      [
        klass,
        resourcePromise.then((r) => {
          assertLink(r)
          assertBreadcrumbLabel(r)
          return { label: r.BreadcrumbLabel, href: r.Link }
        }) satisfies Promise<BreadcrumbSegment>,
        'Edit',
      ] as const,
    [klass, resourcePromise]
  )

  const initialValues = useMemo(
    () => resourcePromise.then((r) => Form.fromResource(r)),
    [resourcePromise, Form]
  )

  const handleSubmit = async (formData: TFormData) => {
    const resource = await resourcePromise

    if (!Resource.hasResourceUrl(resource)) {
      throw new Error(
        `Cannot update ${klass.DomainType} without a resource URL`
      )
    }

    const updated = formData.toUpdatePayload(resource)
    await Effect.runPromise(hub.update(klass, updated))
    assertLink(resource)
    navigate(resource.Link)
  }

  return (
    <FormPage title={`Edit ${klass.Labeled.singularLabel}`}>
      <FormComponent
        onSubmit={handleSubmit}
        submitLabel="Save"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
