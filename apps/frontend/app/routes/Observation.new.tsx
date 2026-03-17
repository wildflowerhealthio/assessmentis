import { Observation } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Observation'
import 'app/traits/Labeled/implementations/Observation'
import 'app/traits/Link/implementations/Observation'

import { CreateResourcePage } from 'app/modules/forms/CreateResourcePage'
import { ObservationForm } from 'app/modules/forms/Observation/ObservationForm'
import { ObservationFormData } from 'app/modules/forms/Observation/ObservationFormData'

export default function ObservationNewPage() {
  return (
    <CreateResourcePage
      klass={Observation}
      Form={ObservationFormData}
      FormComponent={ObservationForm}
    />
  )
}
