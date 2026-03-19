import { cn } from '@assessmentis/react-util'

import classes from '../ResourceForm.module.css'

export interface TextFieldProps {
  name: string
  label?: string
  required?: boolean
  placeholder?: string
  type?: string
  helpText?: string
  error?: string | undefined
  value: string | undefined
  onChange: (value: string) => void
}

export function TextField({
  name,
  label,
  required,
  placeholder,
  type = 'text',
  helpText,
  error,
  value,
  onChange,
}: TextFieldProps): React.JSX.Element {
  return (
    <div className={classes.FormField}>
      {label && (
        <label htmlFor={name} className={cn('label-3', classes.FormField__label)}>
          {label}
          {required && <span className={classes.FormField__required}> *</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        placeholder={placeholder}
        required={required}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      />
      {helpText && <div className={cn('body-3', classes.FormField__help)}>{helpText}</div>}
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
