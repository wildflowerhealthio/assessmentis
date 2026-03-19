import { Patient } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/patient'
import '../traits/Labeled/implementations/patient'
import '../traits/Link/implementations/patient'

import { EditResourcePage } from '@/modules/forms/edit-resource-page'
import { PatientForm } from '@/modules/forms/Patient/patient-form'
import { PatientFormData } from '@/modules/forms/Patient/patient-form-data'

import type { Route } from './+types/Patient.$url.edit'

export default function PatientEditPage({ params }: Route.ComponentProps): React.JSX.Element {
  return (
    <EditResourcePage
      klass={Patient}
      Form={PatientFormData}
      FormComponent={PatientForm}
      url={params.url}
    />
  )
}
