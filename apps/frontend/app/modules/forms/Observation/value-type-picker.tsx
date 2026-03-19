import { cn } from '@assessmentis/react-util'

import classes from '@/modules/common/components/ResourceForm/ResourceForm.module.css'

import type { ValueTypeEnum } from './observation-form-data'

type ValueType = typeof ValueTypeEnum.Type

export interface ValueTypePickerProps {
  name: string
  label?: string
  required?: boolean
  error?: string | undefined
  value: ValueType | undefined
  onChange: (data: ValueType | undefined) => void
}

const valueTypeOptions: readonly { value: ValueType; label: string }[] = [
  { label: 'Text (String)', value: 'valueString' },
  { label: 'Quantity (with Unit)', value: 'valueQuantity' },
  { label: 'Coded Concept', value: 'valueCodeableConcept' },
]

export function ValueTypePicker({
  name,
  label,
  required,
  error,
  value,
  onChange,
}: ValueTypePickerProps): React.JSX.Element {
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
          const match = valueTypeOptions.find((o) => o.value === selected)
          onChange(match?.value)
        }}
      >
        <option value="">Select {label ?? 'value type'}...</option>
        {valueTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
