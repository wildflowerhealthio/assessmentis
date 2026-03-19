import { Observation } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/observation'
import '../traits/Labeled/implementations/observation'
import '../traits/Link/implementations/observation'

import { CreateResourcePage } from '@/modules/forms/create-resource-page'
import { ObservationForm } from '@/modules/forms/Observation/observation-form'
import { ObservationFormData } from '@/modules/forms/Observation/observation-form-data'

export default function ObservationNewPage(): React.JSX.Element {
  return (
    <CreateResourcePage
      klass={Observation}
      Form={ObservationFormData}
      FormComponent={ObservationForm}
    />
  )
}
