import {
  Encounter,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import { BasePicker } from '../../../common/components/BasePicker/BasePicker'
import { usePickerData } from '../../../common/components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../../../common/components/BasePicker/types/PickerTypes'

type EncounterPickerProps = Omit<
  BasePickerProps<{ encounter: Encounter }>,
  'items' | 'loading'
>

function formatEncounterDisplay(encounter: Encounter): string {
  return `Encounter ${encounter.id || 'Unknown'}`
}

function formatEncounterSecondary(encounter: Encounter): string {
  const encounterClass =
    encounter.class?.display || encounter.class?.code || 'Unknown class'
  const status = encounter.status || 'unknown'

  return `${encounterClass} • Status: ${status}`
}

function encounterToPickerItem(
  encounter: Encounter
): PickerItem<{ encounter: Encounter }> {
  return {
    id: encounter.id!,
    displayName: formatEncounterDisplay(encounter),
    secondaryText: formatEncounterSecondary(encounter),
    metadata: { encounter },
  }
}

export function EncounterPicker(props: EncounterPickerProps) {
  const { items, loading, error } = usePickerData({
    repository: EncounterRepository,
    transform: encounterToPickerItem,
  })

  return (
    <BasePicker
      {...props}
      items={items}
      loading={loading}
      error={error?.message || props.error}
      immediate={props.immediate ?? true}
      placeholder={props.placeholder || 'Select an encounter...'}
      label={props.label || 'Encounter'}
    />
  )
}
