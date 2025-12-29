import { FormError } from '../types/FormTypes'

export function formatFieldError(error: FormError): string {
  return error.message
}

export function getFieldError(
  errors: FormError[],
  fieldName: string | symbol | number
): string | undefined {
  const fieldError = errors.find(
    (error) => error.path.length === 1 && error.path[0] === fieldName
  )
  return fieldError ? formatFieldError(fieldError) : undefined
}

export function getFieldLabel(fieldName: string): string {
  // Convert camelCase or snake_case to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}
