import type { AdministrativeGender } from '@assessmentis/clinical-domain/administration'
import { cn, withPromisedValue } from '@assessmentis/react-util'
import classes from 'app/modules/common/components/ResourceForm/ResourceForm.module.css'

export interface GenderPickerSyncProps {
  name: string
  label?: string
  required?: boolean
  error?: string | undefined
  value: AdministrativeGender | undefined
  loading: boolean
  valueError: unknown
  onChange: (data: AdministrativeGender | undefined) => void
}

const genderOptions: ReadonlyArray<{
  value: AdministrativeGender
  label: string
}> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
]

export function GenderPickerSync({
  name,
  label,
  required,
  error,
  value,
  loading,
  valueError,
  onChange,
}: GenderPickerSyncProps) {
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
        disabled={loading || valueError != null}
        value={value ?? ''}
        onChange={(e) => {
          const selected = e.target.value
          onChange(selected ? (selected as AdministrativeGender) : undefined)
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

export const GenderPicker =
  withPromisedValue<GenderPickerSyncProps>(GenderPickerSync)
