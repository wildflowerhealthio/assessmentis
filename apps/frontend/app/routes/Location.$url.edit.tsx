import { Location } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Location'
import 'app/traits/Labeled/implementations/Location'
import 'app/traits/Link/implementations/Location'

import { EditResourcePage } from 'app/modules/forms/EditResourcePage'
import { LocationForm } from 'app/modules/forms/Location/LocationForm'
import { LocationFormData } from 'app/modules/forms/Location/LocationFormData'

import type { Route } from './+types/Location.$url.edit'

export default function LocationEditPage({ params }: Route.ComponentProps) {
  return (
    <EditResourcePage
      klass={Location}
      Form={LocationFormData}
      FormComponent={LocationForm}
      url={params.url}
    />
  )
}
