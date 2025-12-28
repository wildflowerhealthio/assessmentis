import {
  Practitioner,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { usePickerData } from '../../../common/components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../../../common/components/BasePicker/types/PickerTypes'
import { BasePicker } from '../../../common/components/BasePicker/BasePicker'

type PractitionerPickerProps = Omit<
  BasePickerProps<{ practitioner: Practitioner }>,
  'items' | 'loading'
>

function formatPractitionerName(practitioner: Practitioner): string {
  const name = practitioner.name?.[0]
  if (!name) return 'Unnamed Practitioner'

  const givenNames = name.given?.join(' ') ?? ''
  const familyName = name.family ?? ''

  return `${givenNames} ${familyName}`.trim() || 'Unnamed Practitioner'
}

function formatQualification(practitioner: Practitioner): string {
  const qualification = practitioner.qualification?.[0]?.code?.text
  return qualification || 'No qualification listed'
}

function practitionerToPickerItem(
  practitioner: Practitioner
): PickerItem<{ practitioner: Practitioner }> {
  const displayName = formatPractitionerName(practitioner)
  const qualification = formatQualification(practitioner)

  return {
    id: practitioner.id!,
    displayName,
    secondaryText: qualification,
    metadata: { practitioner },
  }
}

export function PractitionerPicker(props: PractitionerPickerProps) {
  const { items, loading, error } = usePickerData({
    repository: PractitionerRepository,
    transform: practitionerToPickerItem,
  })

  return (
    <BasePicker
      {...props}
      items={items}
      loading={loading}
      error={error?.message || props.error}
      immediate={props.immediate ?? true}
      placeholder={props.placeholder || 'Select practitioner(s)...'}
      label={props.label || 'Practitioner'}
    />
  )
}
