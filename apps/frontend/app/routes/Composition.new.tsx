import { Composition } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'

import { CompositionForm } from '@/modules/forms/Composition/composition-form'
import { CompositionFormData } from '@/modules/forms/Composition/composition-form-data'
import { CreateResourcePage } from '@/modules/forms/create-resource-page'

export default function CompositionNewPage(): React.JSX.Element {
  return (
    <CreateResourcePage
      klass={Composition}
      Form={CompositionFormData}
      FormComponent={CompositionForm}
    />
  )
}
