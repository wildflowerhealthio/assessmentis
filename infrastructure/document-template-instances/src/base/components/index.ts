import type { ComponentFamily as ComponentFamilyType } from '@assessmentis/document-template-kinds'

import { Header } from './Header'
import { ObservationSectionWithMethod } from './ObservationSectionWithMethod'
import { ObservationTable } from './ObservationTable'
import { ObservationTableRow } from './ObservationTableRow'
import { Title } from './Title'

const components: ComponentFamilyType['components'] = {
  TitleComponent: Title,
  HeaderComponent: Header,
  ObservationSectionWithMethodComponent: ObservationSectionWithMethod,
  ObservationTableRowComponent: ObservationTableRow,
  ObservationTableComponent: ObservationTable,
}

export default components
