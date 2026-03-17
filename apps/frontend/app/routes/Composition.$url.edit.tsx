import { Composition } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Composition'
import 'app/traits/Labeled/implementations/Composition'
import 'app/traits/Link/implementations/Composition'

import { CompositionForm } from 'app/modules/forms/Composition/CompositionForm'
import { CompositionFormData } from 'app/modules/forms/Composition/CompositionFormData'
import { EditResourcePage } from 'app/modules/forms/EditResourcePage'

import type { Route } from './+types/Composition.$url.edit'

export default function CompositionEditPage({ params }: Route.ComponentProps) {
  return (
    <EditResourcePage
      klass={Composition}
      Form={CompositionFormData}
      FormComponent={CompositionForm}
      url={params.url}
    />
  )
}
