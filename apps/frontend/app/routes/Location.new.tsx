import { Location } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Labeled/implementations/location'
import '../traits/Link/implementations/location'

import { CreateResourcePage } from '@/modules/forms/create-resource-page'
import { LocationForm } from '@/modules/forms/Location/location-form'
import { LocationFormData } from '@/modules/forms/Location/location-form-data'

export default function LocationNewPage(): React.JSX.Element {
  return (
    <CreateResourcePage klass={Location} Form={LocationFormData} FormComponent={LocationForm} />
  )
}
