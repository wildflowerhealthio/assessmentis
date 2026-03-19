import { Composition } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'
/* eslint-enable import/no-unassigned-import */

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
