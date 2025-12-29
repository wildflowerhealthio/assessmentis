import React, { FormEvent, useState } from 'react'
import { Either, Schema } from 'effect'
import { cn } from '@assessmentis/react-util'
import { FormError } from './types/FormTypes'
import { extractFormErrors } from './utils/validation'
import { getFieldError, getFieldLabel } from './utils/errorFormatting'
import classes from './ResourceForm.module.css'

export type CommonFieldProps<T> = {
  error?: string | undefined
  defaultValue?: T | undefined
  value: T | undefined
  onChange: (data: T) => void
}

interface ResourceFormProps<A extends object, E extends object> {
  schema: Schema.Schema<A, E, never>
  fields: {
    [k in keyof E]: React.FC<CommonFieldProps<E[k]>>
  }
  fieldOrder: ReadonlyArray<keyof E>
  onSubmit: (data: A) => void | Promise<void>
  submitLabel?: string
  initialValues?: Partial<E>
  className?: string
}

export function ResourceForm<A extends object, E extends object>({
  schema,
  fields,
  fieldOrder,
  onSubmit,
  submitLabel = 'Submit',
  initialValues = {},
  className,
}: ResourceFormProps<A, E>) {
  const [content, setContent] = useState<Partial<E>>(initialValues)
  const [formErrors, setFormErrors] = useState<FormError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors([])
    setIsSubmitting(true)

    try {
      // Parse against schema - returns Either<ParseError, T>
      const result = Schema.decodeUnknownEither(schema)(content)

      // Handle validation result
      if (Either.isLeft(result)) {
        setFormErrors(extractFormErrors(result.left))
        return
      }

      // Call onSubmit with validated data
      await onSubmit(result.right)
    } catch (error) {
      console.error('Form submission error:', error)
      setFormErrors([
        {
          path: [],
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        },
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = <const N extends keyof E>(name: N) => {
    const FieldComponent: React.FC<CommonFieldProps<E[N]>> = fields[name]
    const fieldError = getFieldError(formErrors, name)

    const onChange = (data: E[N]) =>
      setContent((content) => ({ ...content, [name]: data }))
    return (
      <FieldComponent
        value={content[name]}
        onChange={onChange}
        error={fieldError}
      />
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(classes.Form, className)}
      noValidate
    >
      {formErrors.length > 0 && (
        <div className={classes.Form__errors}>
          <h3 className="heading-3">Please fix the following errors:</h3>
          <ul className={classes.Form__errorList}>
            {formErrors.map((error, index) => (
              <li key={index} className="body-3">
                {error.path.length > 0
                  ? `${getFieldLabel(error.path[0])}: ${error.message}`
                  : error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={classes.Form__fields}>
        {fieldOrder.map((fieldName) => renderField(fieldName))}
      </div>

      <div className={classes.Form__submit}>
        <button type="submit" className="button-2 blue" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
