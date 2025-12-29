import { cn } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface DateFieldProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  defaultValue?: string | undefined
  value?: string | undefined
  onChange: (data: string | undefined) => void
}

export function DateField({
  name,
  label,
  required,
  error,
  value,
  onChange,
  defaultValue,
}: DateFieldProps) {
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
      <input
        type="date"
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => {
          onChange(e.target.value.length === 0 ? undefined : e.target.value)
        }}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
