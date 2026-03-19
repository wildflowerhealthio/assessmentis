import { cn } from '@assessmentis/react-util'

import classes from '../ResourceForm.module.css'

export interface DateFieldProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  value: string | undefined
  onChange: (data: string | undefined) => void
}

export function DateField({
  name,
  label,
  required,
  error,
  value,
  onChange,
}: DateFieldProps): React.JSX.Element {
  return (
    <div className={classes.FormField}>
      {label && (
        <label htmlFor={name} className={cn('label-3', classes.FormField__label)}>
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
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value || undefined)
        }}
      />
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
