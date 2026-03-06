import { Composition } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Composition'
import 'app/traits/Labeled/implementations/Composition'
import 'app/traits/Link/implementations/Composition'

import { CompositionForm } from 'app/modules/forms/Composition/CompositionForm'
import { CompositionFormData } from 'app/modules/forms/Composition/CompositionFormData'
import { CreateResourcePage } from 'app/modules/forms/CreateResourcePage'

export default function CompositionNewPage() {
  return (
    <CreateResourcePage
      klass={Composition}
      Form={CompositionFormData}
      FormComponent={CompositionForm}
    />
  )
}
