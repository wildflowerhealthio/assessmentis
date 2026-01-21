import { cn, useLoadingPromise } from '@assessmentis/react-util'
import classes from '../ResourceForm.module.css'
import { FC } from 'react'

export interface TextFieldProps {
  name: string
  label?: string
  required?: boolean
  placeholder?: string
  error?: string | undefined
  defaultValue?: string | undefined
  value: Promise<string | undefined>
  onChange: (value: string) => void
}

export const TextField: FC<TextFieldProps> = ({
  name,
  label,
  required,
  placeholder,
  error,
  defaultValue,
  value,
  onChange,
}: TextFieldProps) => {
  const {
    value: resolvedValue,
    loading,
    error: valueError,
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
        type="text"
        id={name}
        name={name}
        className={cn('input-2', error && classes['FormField__input--error'])}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        value={resolvedValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || valueError !== undefined}
      />
      {error && (
        <div className={cn('body-3', classes.FormField__error)}>{error}</div>
      )}
    </div>
  )
}
