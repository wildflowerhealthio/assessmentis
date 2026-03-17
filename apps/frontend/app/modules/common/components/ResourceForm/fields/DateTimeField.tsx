import { DateTime, Option } from 'effect'

import { cn } from '@assessmentis/react-util'

import classes from '../ResourceForm.module.css'

export interface DateTimeFieldProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  value: DateTime.Zoned | undefined
  onChange: (data: DateTime.Zoned | undefined) => void
}

/**
 * Convert Effect DateTime to ISO string for datetime-local input.
 * datetime-local requires exactly YYYY-MM-DDTHH:mm format.
 */
function dateTimeToInputValue(dateTime: DateTime.Zoned | undefined): string {
  if (dateTime == undefined) return ''
  const date = new Date(Number(DateTime.toEpochMillis(dateTime)))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Convert datetime-local input value to Effect DateTime
 */
function inputValueToDateTime(value: string): DateTime.Zoned | undefined {
  if (!value) return undefined
  return DateTime.makeZoned(`${value}:00`, {
    adjustForTimeZone: true,
    timeZone: DateTime.zoneMakeLocal(),
  }).pipe(Option.getOrThrow)
}

export function DateTimeField({
  name,
  label,
  required,
  error,
  value,
  onChange,
}: DateTimeFieldProps) {
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
        type="datetime-local"
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        required={required}
        value={dateTimeToInputValue(value)}
        onChange={(e) => {
          onChange(inputValueToDateTime(e.target.value))
        }}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
