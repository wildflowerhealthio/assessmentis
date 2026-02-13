import { cn } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface TextAreaFieldProps {
  name: string
  label?: string
  required?: boolean
  placeholder?: string
  rows?: number
  error?: string
  value: string | undefined
  onChange: (value: string) => void
}

export function TextAreaField({
  name,
  label,
  required,
  placeholder,
  rows = 4,
  error,
  value,
  onChange,
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
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
