import { Location } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Labeled/implementations/location'
import '../traits/Link/implementations/location'
/* eslint-enable import/no-unassigned-import */

import { CreateResourcePage } from '@/modules/forms/create-resource-page'
import { LocationForm } from '@/modules/forms/Location/location-form'
import { LocationFormData } from '@/modules/forms/Location/location-form-data'

export default function LocationNewPage(): React.JSX.Element {
  return (
    <CreateResourcePage klass={Location} Form={LocationFormData} FormComponent={LocationForm} />
  )
}
