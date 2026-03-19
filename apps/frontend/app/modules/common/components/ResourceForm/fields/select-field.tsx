import { cn } from '@assessmentis/react-util'

import classes from '../ResourceForm.module.css'

export interface SelectFieldProps<T extends string = string> {
  name: string
  label?: string
  required?: boolean
  options: readonly { value: T; label: string }[]
  error?: string | undefined
  value: T | undefined
  onChange: (data: T | undefined) => void
}

export function SelectField<T extends string>({
  name,
  label,
  required,
  options,
  error,
  value,
  onChange = (): void => {},
}: SelectFieldProps<T>): React.JSX.Element {
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
          const match = options.find((o) => o.value === e.target.value)
          onChange(match?.value)
        }}
      >
        <option value="">Select {label ?? 'option'}...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
