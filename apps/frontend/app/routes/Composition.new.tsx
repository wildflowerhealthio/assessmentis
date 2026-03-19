import { Composition } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'
/* eslint-enable import/no-unassigned-import */

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
