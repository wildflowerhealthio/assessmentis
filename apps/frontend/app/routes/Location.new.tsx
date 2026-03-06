import { Location } from '@assessmentis/clinical-domain'

import 'app/traits/BreadcrumbLabel/implementations/Location'
import 'app/traits/Labeled/implementations/Location'
import 'app/traits/Link/implementations/Location'

import { CreateResourcePage } from 'app/modules/forms/CreateResourcePage'
import { LocationForm } from 'app/modules/forms/Location/LocationForm'
import { LocationFormData } from 'app/modules/forms/Location/LocationFormData'

export default function LocationNewPage() {
  return (
    <CreateResourcePage
      klass={Location}
      Form={LocationFormData}
      FormComponent={LocationForm}
    />
  )
}
