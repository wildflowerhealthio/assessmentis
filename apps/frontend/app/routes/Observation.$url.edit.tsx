import { Observation } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/observation'
import '../traits/Labeled/implementations/observation'
import '../traits/Link/implementations/observation'

import { EditResourcePage } from '@/modules/forms/edit-resource-page'
import { ObservationForm } from '@/modules/forms/Observation/observation-form'
import { ObservationFormData } from '@/modules/forms/Observation/observation-form-data'

import type { Route } from './+types/Observation.$url.edit'

export default function ObservationEditPage({ params }: Route.ComponentProps): React.JSX.Element {
  return (
    <EditResourcePage
      klass={Observation}
      Form={ObservationFormData}
      FormComponent={ObservationForm}
      url={params.url}
    />
  )
}
