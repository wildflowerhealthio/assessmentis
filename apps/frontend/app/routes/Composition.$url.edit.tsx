import { Composition } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'

import { CompositionForm } from '@/modules/forms/Composition/composition-form'
import { CompositionFormData } from '@/modules/forms/Composition/composition-form-data'
import { EditResourcePage } from '@/modules/forms/edit-resource-page'

import type { Route } from './+types/Composition.$url.edit'

export default function CompositionEditPage({ params }: Route.ComponentProps): React.JSX.Element {
  return (
    <EditResourcePage
      klass={Composition}
      Form={CompositionFormData}
      FormComponent={CompositionForm}
      url={params.url}
    />
  )
}
