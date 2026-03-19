import type { ComponentFamily as ComponentFamilyType } from '@assessmentis/document-template-kinds'

import { Header } from './header'
import { ObservationSectionWithMethod } from './observation-section-with-method'
import { ObservationTable } from './observation-table'
import { ObservationTableRow } from './observation-table-row'
import { Title } from './title'

const components: ComponentFamilyType['components'] = {
  HeaderComponent: Header,
  ObservationSectionWithMethodComponent: ObservationSectionWithMethod,
  ObservationTableComponent: ObservationTable,
  ObservationTableRowComponent: ObservationTableRow,
  TitleComponent: Title,
}

export default components
