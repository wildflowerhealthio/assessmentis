import { cn } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface TextAreaFieldProps {
  name: string
  label?: string
  required?: boolean
  placeholder?: string
  rows?: number
  error?: string
  defaultValue?: string
}

export function TextAreaField({
  name,
  label,
  required,
  placeholder,
  rows = 4,
  error,
  defaultValue,
}: TextAreaFieldProps) {
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
      <textarea
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        placeholder={placeholder}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
