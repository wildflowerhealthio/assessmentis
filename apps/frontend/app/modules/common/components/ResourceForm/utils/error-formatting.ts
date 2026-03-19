import type { FormError } from '../types/form-types'

export function formatFieldError(error: FormError): string {
  return error.message
}

export function getFieldError(
  errors: FormError[],
  fieldName: string | symbol | number
): string | undefined {
  const fieldError = errors.find((error) => error.path.length === 1 && error.path[0] === fieldName)
  if (fieldError) {
    return formatFieldError(fieldError)
  }
  return undefined
}

export function getFieldLabel(fieldName: string): string {
  // Convert camelCase or snake_case to Title Case
  return fieldName
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll(/[_-]/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}
