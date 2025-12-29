import {
  Patient,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { BasePicker } from '../../../common/components/BasePicker/BasePicker'
import { usePickerData } from '../../../common/components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../../../common/components/BasePicker/types/PickerTypes'
import {
  formatGender,
  formatDate,
  formatHumanName,
} from '../../../common/utils/fhirDisplay'

type PatientPickerProps = Omit<
  BasePickerProps<{ patient: Patient }>,
  'items' | 'loading'
>

function patientToPickerItem(
  patient: Patient
): PickerItem<{ patient: Patient }> {
  const displayName = formatHumanName(patient.name?.[0], 'Unnamed Patient')
  const gender = formatGender(patient.gender)
  const birthDate = formatDate(patient.birthDate)

  return {
    id: patient.id!,
    displayName,
    secondaryText: `${gender} • Born: ${birthDate}`,
    metadata: { patient },
  }
}

export function PatientPicker(props: PatientPickerProps) {
  const { items, loading, error } = usePickerData({
    repository: PatientRepository,
    transform: patientToPickerItem,
  })

  const innerProps: BasePickerProps<{ patient: Patient }> = {
    ...props,
    items,
    loading,
    immediate: props.immediate ?? true,
    error: error?.message || props.error,
    placeholder: props.placeholder || 'Select a patient...',
    label: props.label || 'Patient',
  }
  return <BasePicker {...innerProps} />
}
