import { Practitioner } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Practitioner'
import 'app/traits/Labeled/implementations/Practitioner'
import 'app/traits/Link/implementations/Practitioner'

import { EditResourcePage } from 'app/modules/forms/EditResourcePage'
import { PractitionerForm } from 'app/modules/forms/Practitioner/PractitionerForm'
import { PractitionerFormData } from 'app/modules/forms/Practitioner/PractitionerFormData'

import type { Route } from './+types/Practitioner.$url.edit'

export default function PractitionerEditPage({ params }: Route.ComponentProps) {
  return (
    <EditResourcePage
      klass={Practitioner}
      Form={PractitionerFormData}
      FormComponent={PractitionerForm}
      url={params.url}
    />
  )
}
