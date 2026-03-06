import { Effect } from 'effect'
import { useMemo, type ComponentType } from 'react'
import { useNavigate } from 'react-router'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import { useHub } from '../../layers/useHub'
import { useResourceSubscription } from '../../layers/useResourceSubscription'
import {
  assertBreadcrumbLabel,
  type BreadcrumbLabelConstructor,
} from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { DomainTypedConstructor } from '../../traits/DomainTyped/DomainTyped'
import type { LabeledConstructor } from '../../traits/Labeled/Labeled'
import { assertLink, type LinkConstructor } from '../../traits/Link/Link'
import type { BreadcrumbSegment } from '../Breadcrumbs/BreadcrumbContext'
import { useBreadcrumbs } from '../Breadcrumbs/useBreadcrumbs'
import { FormPage } from '../common/components/FormPage/FormPage'
import type {
  ResourceFormData,
  ResourceFormDataConstructor,
} from './ResourceFormData'

export function EditResourcePage<
  K extends keyof ResourceDataTypes & string,
  TFormData extends ResourceFormData<K>,
  TFormDataEncoded,
>({
  klass,
  Form,
  FormComponent,
  url: rawUrl,
}: {
  klass: LabeledConstructor &
    BreadcrumbLabelConstructor &
    LinkConstructor &
    DomainTypedConstructor<K>
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
  const breadcrumbSegmentPromise = useMemo(
    () =>
      resourcePromise.then((r): BreadcrumbSegment => {
        assertLink(r)
        assertBreadcrumbLabel(r)
        return { href: r.Link, label: r.BreadcrumbLabel }
      }),
    [resourcePromise]
  )
  useBreadcrumbs(klass, breadcrumbSegmentPromise, 'Edit')

  const initialValues = useMemo(
    () => resourcePromise.then((r) => Form.fromResource(r)),
    [resourcePromise, Form]
  )

  const handleSubmit = async (formData: TFormData) => {
    const resource = await resourcePromise

    const updated = formData.toUpdatePayload(resource)
    await Effect.runPromise(hub.update(klass.DomainType, updated))
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
