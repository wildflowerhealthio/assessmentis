import { ParseResult } from 'effect'

import type { FormError } from '../types/form-types'

export function extractFormErrors(parseError: ParseResult.ParseError): FormError[] {
  const errors: FormError[] = []

  const issues = ParseResult.ArrayFormatter.formatErrorSync(parseError)

  issues.forEach((issue) => {
    errors.push({
      message: issue.message,
      path: issue.path.map((x) => String(x)),
    })
  })

  return errors
}
