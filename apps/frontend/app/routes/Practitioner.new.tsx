import { Practitioner } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Practitioner'
import 'app/traits/Labeled/implementations/Practitioner'
import 'app/traits/Link/implementations/Practitioner'

import { CreateResourcePage } from 'app/modules/forms/CreateResourcePage'
import { PractitionerForm } from 'app/modules/forms/Practitioner/PractitionerForm'
import { PractitionerFormData } from 'app/modules/forms/Practitioner/PractitionerFormData'

export default function PractitionerNewPage() {
  return (
    <CreateResourcePage
      klass={Practitioner}
      Form={PractitionerFormData}
      FormComponent={PractitionerForm}
    />
  )
}
