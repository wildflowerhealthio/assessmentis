import { Patient } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/patient'
import '../traits/Labeled/implementations/patient'
import '../traits/Link/implementations/patient'

import { CreateResourcePage } from '@/modules/forms/create-resource-page'
import { PatientForm } from '@/modules/forms/Patient/patient-form'
import { PatientFormData } from '@/modules/forms/Patient/patient-form-data'

export default function PatientNewPage(): React.JSX.Element {
  return <CreateResourcePage klass={Patient} Form={PatientFormData} FormComponent={PatientForm} />
}
