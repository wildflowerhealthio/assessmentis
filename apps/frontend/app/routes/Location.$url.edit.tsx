import { Location } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Labeled/implementations/location'
import '../traits/Link/implementations/location'

import { EditResourcePage } from '@/modules/forms/edit-resource-page'
import { LocationForm } from '@/modules/forms/Location/location-form'
import { LocationFormData } from '@/modules/forms/Location/location-form-data'

import type { Route } from './+types/Location.$url.edit'

export default function LocationEditPage({ params }: Route.ComponentProps): React.JSX.Element {
  return (
    <EditResourcePage
      klass={Location}
      Form={LocationFormData}
      FormComponent={LocationForm}
      url={params.url}
    />
  )
}
