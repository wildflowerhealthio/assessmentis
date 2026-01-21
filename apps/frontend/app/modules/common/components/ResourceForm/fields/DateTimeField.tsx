import { DateTime, Option } from 'effect'
import { cn, useLoadingPromise } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'

export interface DateTimeFieldProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  value: Promise<DateTime.Zoned | undefined>
  onChange: (data: DateTime.Zoned | undefined) => void
}

/**
 * Convert Effect DateTime to ISO string for datetime-local input
 */
function dateTimeToInputValue(dateTime: DateTime.Zoned | undefined): string {
  if (dateTime == undefined) return ''
  // datetime-local input expects format: YYYY-MM-DDTHH:mm
  return DateTime.formatLocal(dateTime).slice(0, 16)
}

/**
 * Convert datetime-local input value to Effect DateTime
 */
function inputValueToDateTime(value: string): DateTime.Zoned | undefined {
  if (!value) return undefined
  // Append seconds and timezone to make it a complete ISO string
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
  const {
    value: resolvedValue,
    loading,
    error: loadingError,
  } = useLoadingPromise(value)

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
        disabled={loading || !!loadingError}
        value={dateTimeToInputValue(resolvedValue)}
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
