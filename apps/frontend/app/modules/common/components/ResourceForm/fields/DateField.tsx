import { cn } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface DateFieldProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  defaultValue?: Date | undefined
  value?: Date | undefined
  onChange: (data: Date | undefined) => void
}

/**
 * Convert Date to YYYY-MM-DD format for date input
 */
function dateToInputValue(date: Date | undefined): string {
  if (!date) return ''
  // Get the date in local timezone and format as YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert YYYY-MM-DD input value to Date
 */
function inputValueToDate(value: string): Date | undefined {
  if (!value) return undefined
  // Parse as YYYY-MM-DD and create date in local timezone
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
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
        defaultValue={dateToInputValue(defaultValue)}
        value={dateToInputValue(value)}
        onChange={(e) => {
          onChange(inputValueToDate(e.target.value))
        }}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
