import { Patient } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Patient'
import 'app/traits/Labeled/implementations/Patient'
import 'app/traits/Link/implementations/Patient'

import { EditResourcePage } from 'app/modules/forms/EditResourcePage'
import { PatientForm } from 'app/modules/forms/Patient/PatientForm'
import { PatientFormData } from 'app/modules/forms/Patient/PatientFormData'

import type { Route } from './+types/Patient.$url.edit'

export default function PatientEditPage({ params }: Route.ComponentProps) {
  return (
    <EditResourcePage
      klass={Patient}
      Form={PatientFormData}
      FormComponent={PatientForm}
      url={params.url}
    />
  )
}
