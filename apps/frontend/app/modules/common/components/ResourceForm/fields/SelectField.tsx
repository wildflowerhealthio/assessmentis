import { cn } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface SelectFieldProps<T extends string> {
  name: string
  label?: string
  required?: boolean
  options: Array<{ value: T; label: string }>
  error?: string | undefined
  defaultValue?: T | undefined
}

export function SelectField<T extends string>({
  name,
  label,
  required,
  options,
  error,
  defaultValue,
}: SelectFieldProps<T>) {
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
        defaultValue={defaultValue}
      >
        <option value={undefined}>Select {label || 'option'}...</option>
        {options.map((option) => (
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
