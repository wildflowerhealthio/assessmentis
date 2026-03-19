import { Practitioner } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Labeled/implementations/practitioner'
import '../traits/Link/implementations/practitioner'
/* eslint-enable import/no-unassigned-import */

import { CreateResourcePage } from '@/modules/forms/create-resource-page'
import { PractitionerForm } from '@/modules/forms/Practitioner/practitioner-form'
import { PractitionerFormData } from '@/modules/forms/Practitioner/practitioner-form-data'

export default function PractitionerNewPage(): React.JSX.Element {
  return (
    <CreateResourcePage
      klass={Practitioner}
      Form={PractitionerFormData}
      FormComponent={PractitionerForm}
    />
  )
}
