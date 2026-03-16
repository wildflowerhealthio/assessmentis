import { useState } from 'react'
import type { ComponentType } from 'react'

import classes from '../ResourceForm.module.css'

export interface PickerComponentProps {
  value: string | string[] | undefined
  onChange: (value: string | string[] | undefined) => void
  label?: string
  required?: boolean
  multiple?: boolean
  error?: string
}

export interface PickerFieldProps {
  name: string
  label?: string
  required?: boolean
  component: ComponentType<PickerComponentProps>
  multiple?: boolean
  error?: string
  defaultValue?: string | string[]
}

export function PickerField({
  name,
  label,
  required,
  component: PickerComponent,
  multiple,
  error,
  defaultValue,
}: PickerFieldProps) {
  const [value, setValue] = useState<string | string[] | undefined>(
    defaultValue
  )

  // Convert value to form data format
  const formValue = Array.isArray(value) ? value.join(',') : value || ''

  return (
    <div className={classes.FormField}>
      <PickerComponent
        value={value}
        onChange={setValue}
        label={label}
        required={required}
        multiple={multiple}
        error={error}
      />
      <input type="hidden" name={name} value={formValue} />
    </div>
  )
}
