import type { ValueTypeEnum } from '../schemas/ObservationFormSchema'
import { cn, withPromisedValue } from '@assessmentis/react-util'
import classes from 'app/modules/common/components/ResourceForm/ResourceForm.module.css'

type ValueType = typeof ValueTypeEnum.Type

export interface ValueTypePickerSyncProps {
  name: string
  label?: string
  required?: boolean
  error?: string | undefined
  value: ValueType | undefined
  loading: boolean
  valueError: unknown
  onChange: (data: ValueType | undefined) => void
}

const valueTypeOptions: ReadonlyArray<{ value: ValueType; label: string }> = [
  { value: 'valueString', label: 'Text (String)' },
  { value: 'valueDecimal', label: 'Decimal Number' },
  { value: 'valueQuantity', label: 'Quantity (with Unit)' },
  { value: 'valueCodeableConcept', label: 'Coded Concept' },
]

export function ValueTypePickerSync({
  name,
  label,
  required,
  error,
  value,
  loading,
  valueError,
  onChange,
}: ValueTypePickerSyncProps) {
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
          onChange(selected ? (selected as ValueType) : undefined)
        }}
      >
        <option value="">Select {label || 'value type'}...</option>
        {valueTypeOptions.map((option) => (
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

export const ValueTypePicker =
  withPromisedValue<ValueTypePickerSyncProps>(ValueTypePickerSync)
