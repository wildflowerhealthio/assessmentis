import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { Coding } from '@assessmentis/clinical-domain/data-types'

import { type WithId } from '@assessmentis/clinical-domain/data-types'

export type HeaderComponent = React.FC<{ title: string }>

export type ObservationSectionWithMethodComponent = React.FC<{
  observation: WithId<Observation>
}>

export type ObservationTableRowProps = {
  observation: WithId<Observation>
  columnCodings: ReadonlyArray<ReadonlyArray<Coding>>
}

export type ObservationTableRowComponent = React.FC<ObservationTableRowProps>

export type ObservationTableComponent = React.FC<{
  observationLabel: string
  observations: ReadonlyArray<WithId<Observation>>
  columns: ReadonlyArray<{
    label: string
    codings: ReadonlyArray<Coding>
  }>
}>

export type TitleComponent = React.FC<{ title: string }>

export type ComponentFamily = {
  components: {
    TitleComponent: TitleComponent
    HeaderComponent: HeaderComponent
    ObservationSectionWithMethodComponent: ObservationSectionWithMethodComponent
    ObservationTableRowComponent: ObservationTableRowComponent
    ObservationTableComponent: ObservationTableComponent
  }
}
