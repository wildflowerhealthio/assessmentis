import { Practitioner } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Labeled/implementations/practitioner'
import '../traits/Link/implementations/practitioner'

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
