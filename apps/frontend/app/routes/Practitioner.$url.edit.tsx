import { Practitioner } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Labeled/implementations/practitioner'
import '../traits/Link/implementations/practitioner'
/* eslint-enable import/no-unassigned-import */

import { EditResourcePage } from '@/modules/forms/edit-resource-page'
import { PractitionerForm } from '@/modules/forms/Practitioner/practitioner-form'
import { PractitionerFormData } from '@/modules/forms/Practitioner/practitioner-form-data'

import type { Route } from './+types/Practitioner.$url.edit'

export default function PractitionerEditPage({ params }: Route.ComponentProps): React.JSX.Element {
  return (
    <EditResourcePage
      klass={Practitioner}
      Form={PractitionerFormData}
      FormComponent={PractitionerForm}
      url={params.url}
    />
  )
}
