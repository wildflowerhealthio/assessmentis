import type { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { cn } from '@assessmentis/react-util'

import classes from '@/modules/common/components/ResourceForm/ResourceForm.module.css'

export interface GenderPickerProps {
  name: string
  label?: string
  required?: boolean
  error?: string | undefined
  value: AdministrativeGender | undefined
  onChange: (data: AdministrativeGender | undefined) => void
}

const genderOptions: readonly {
  value: AdministrativeGender
  label: string
}[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Unknown', value: 'unknown' },
]

export function GenderPicker({
  name,
  label,
  required,
  error,
  value,
  onChange,
}: GenderPickerProps): React.JSX.Element {
  return (
    <div className={classes.FormField}>
      {label && (
        <label htmlFor={name} className={cn('label-3', classes.FormField__label)}>
          {label}
          {required && <span className={classes.FormField__required}> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        required={required}
        value={value ?? ''}
        onChange={(e) => {
          const selected = e.target.value
          const match = genderOptions.find((o) => o.value === selected)
          onChange(match?.value)
        }}
      >
        <option value="">Select {label ?? 'gender'}...</option>
        {genderOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
