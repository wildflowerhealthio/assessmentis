import { Observation } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Observation'
import 'app/traits/Labeled/implementations/Observation'
import 'app/traits/Link/implementations/Observation'

import { EditResourcePage } from 'app/modules/forms/EditResourcePage'
import { ObservationForm } from 'app/modules/forms/Observation/ObservationForm'
import { ObservationFormData } from 'app/modules/forms/Observation/ObservationFormData'

import type { Route } from './+types/Observation.$url.edit'

export default function ObservationEditPage({ params }: Route.ComponentProps) {
  return (
    <EditResourcePage
      klass={Observation}
      Form={ObservationFormData}
      FormComponent={ObservationForm}
      url={params.url}
    />
  )
}
