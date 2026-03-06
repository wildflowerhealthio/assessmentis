import { Patient } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Patient'
import 'app/traits/Labeled/implementations/Patient'
import 'app/traits/Link/implementations/Patient'

import { CreateResourcePage } from 'app/modules/forms/CreateResourcePage'
import { PatientForm } from 'app/modules/forms/Patient/PatientForm'
import { PatientFormData } from 'app/modules/forms/Patient/PatientFormData'

export default function PatientNewPage() {
  return (
    <CreateResourcePage
      klass={Patient}
      Form={PatientFormData}
      FormComponent={PatientForm}
    />
  )
}
