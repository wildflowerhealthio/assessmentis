import type { Observation } from '@assessmentis/clinical-domain'
import type { Coding } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

export type HeaderComponent = React.FC<{ title: string }>

export type ObservationSectionWithMethodComponent = React.FC<{
  observation: Resource.WithResourceUrl<Observation>
}>

export type ObservationTableRowProps = {
  observation: Resource.WithResourceUrl<Observation>
  columnCodings: ReadonlyArray<ReadonlyArray<Coding>>
}

export type ObservationTableRowComponent = React.FC<ObservationTableRowProps>

export type ObservationTableComponent = React.FC<{
  observationLabel: string
  observations: ReadonlyArray<Resource.WithResourceUrl<Observation>>
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
