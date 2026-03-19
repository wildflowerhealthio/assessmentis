import { cn } from '@assessmentis/react-util'

import classes from '../ResourceForm.module.css'

export interface CheckboxFieldProps {
  name: string
  label?: string
  error?: string
  defaultValue?: boolean
}

export function CheckboxField({
  name,
  label,
  error,
  defaultValue,
}: CheckboxFieldProps): React.JSX.Element {
  return (
    <div className={classes.FormField}>
      <label className={cn('label-3', classes.FormField__checkboxLabel)}>
        <input
          type="checkbox"
          name={name}
          className={classes.FormField__checkbox}
          defaultChecked={defaultValue}
        />
        {label}
      </label>
      {error && <div className={cn('body-3', classes.FormField__error)}>{error}</div>}
    </div>
  )
}
