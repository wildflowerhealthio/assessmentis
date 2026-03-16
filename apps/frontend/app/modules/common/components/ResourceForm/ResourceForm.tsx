import { Either, Schema } from 'effect'
import React, { Suspense, use, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { cn } from '@assessmentis/react-util'

import classes from './ResourceForm.module.css'
import type { FormError } from './types/FormTypes'
import { getFieldError, getFieldLabel } from './utils/errorFormatting'
import { extractFormErrors } from './utils/validation'

export type CommonFieldProps<T> = {
  error?: string | undefined
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
  initialValues?: Partial<E> | Promise<Partial<E>>
  className?: string
}

export function ResourceForm<A extends object, E extends object>(
  props: ResourceFormProps<A, E>
) {
  const { initialValues } = props
  if (initialValues instanceof Promise) {
    return (
      <Suspense
        fallback={
          <FormSkeleton
            fieldCount={props.fieldOrder.length}
            className={props.className}
          />
        }
      >
        <AsyncResourceForm {...props} initialValues={initialValues} />
      </Suspense>
    )
  }
  return <SyncResourceForm {...props} initialValues={initialValues} />
}

function AsyncResourceForm<A extends object, E extends object>({
  initialValues,
  ...rest
}: Omit<ResourceFormProps<A, E>, 'initialValues'> & {
  initialValues: Promise<Partial<E>>
}) {
  const resolved = use(initialValues)
  return <SyncResourceForm {...rest} initialValues={resolved} />
}

function SyncResourceForm<A extends object, E extends object>({
  schema,
  fields,
  fieldOrder,
  onSubmit,
  submitLabel = 'Submit',
  initialValues,
  className,
}: Omit<ResourceFormProps<A, E>, 'initialValues'> & {
  initialValues?: Partial<E>
}) {
  const [content, setContent] = useState<Partial<E>>(initialValues ?? {})
  const [formErrors, setFormErrors] = useState<FormError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors([])
    setIsSubmitting(true)

    try {
      const result = Schema.decodeUnknownEither(schema)(content)

      if (Either.isLeft(result)) {
        setFormErrors(extractFormErrors(result.left))
        return
      }

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

  // Stable onChange handlers — one per field, persisted across renders
  const onChangeMap = useRef(new Map<keyof E, (value: E[keyof E]) => void>())
  const getOnChange = <N extends keyof E>(name: N): ((data: E[N]) => void) => {
    if (!onChangeMap.current.has(name)) {
      onChangeMap.current.set(name, (data: E[keyof E]) =>
        setContent((prev) => ({ ...prev, [name]: data }))
      )
    }
    return onChangeMap.current.get(name)! as (data: E[N]) => void
  }

  const renderField = <const N extends keyof E>(name: N) => {
    const FieldComponent: React.FC<CommonFieldProps<E[N]>> = fields[name]
    const fieldError = getFieldError(formErrors, name)

    return (
      <FieldComponent
        key={String(name)}
        value={content[name] as E[N] | undefined}
        onChange={getOnChange(name)}
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
        <button
          type="submit"
          className="element-button button-2 blue filled"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function FormSkeleton({
  fieldCount,
  className,
}: {
  fieldCount: number
  className?: string
}) {
  return (
    <div className={cn(classes.Form, className)}>
      <div className={classes.Form__fields}>
        {Array.from({ length: fieldCount }, (_, i) => (
          <div key={i} className={classes.FormField}>
            <div
              className={classes.FormField__skeleton}
              style={{ height: '2.5rem' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
