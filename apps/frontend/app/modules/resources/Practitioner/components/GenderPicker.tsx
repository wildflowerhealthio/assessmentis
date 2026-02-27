import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { cn } from '@assessmentis/react-util'
import classes from 'app/modules/common/components/ResourceForm/ResourceForm.module.css'

export interface GenderPickerProps {
  name: string
  label?: string
  required?: boolean
  error?: string | undefined
  value: AdministrativeGender.AdministrativeGender | undefined
  onChange: (data: AdministrativeGender.AdministrativeGender | undefined) => void
}

const genderOptions: ReadonlyArray<{
  value: AdministrativeGender.AdministrativeGender
  label: string
}> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
]

export function GenderPicker({
  name,
  label,
  required,
  error,
  value,
  onChange,
}: GenderPickerProps) {
  return (
    <div className={classes.FormField}>
      {label && (
        <label
          htmlFor={name}
          className={cn('label-3', classes.FormField__label)}
        >
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
          onChange(selected ? (selected as AdministrativeGender.AdministrativeGender) : undefined)
        }}
      >
        <option value="">Select {label || 'gender'}...</option>
        {genderOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
