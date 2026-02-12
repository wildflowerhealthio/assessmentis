import { ParseResult } from 'effect'
import type { FormError } from '../types/FormTypes'

export function extractFormErrors(
  parseError: ParseResult.ParseError
): FormError[] {
  const errors: FormError[] = []

  const issues = ParseResult.ArrayFormatter.formatErrorSync(parseError)

  issues.forEach((issue) => {
    errors.push({
      path: [...issue.path] as string[],
      message: issue.message,
    })
  })

  return errors
}
