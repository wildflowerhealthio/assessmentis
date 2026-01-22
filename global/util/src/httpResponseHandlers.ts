import { Effect } from 'effect'
import { failUnless } from './failUnless'

/**
 * Generic HTTP response interface
 */
export interface HttpResponse<TData = unknown> {
  status: number
  statusText?: string
  data: TData
}

/**
 * Creates an error handler that fails when response status matches the given code
 * @param statusCode - The HTTP status code to check
 * @param makeError - Function to create the error from the response
 * @returns Effect handler that can be piped after HTTP calls
 */
export const failOnHttpStatus = <TData, E>(
  statusCode: number,
  makeError: (resp: HttpResponse<TData>) => E
) =>
  Effect.flatMap((resp: HttpResponse<TData>) =>
    failUnless(
      (r: HttpResponse<TData>) => r.status !== statusCode,
      makeError
    )(resp)
  )

/**
 * Creates an error handler that fails when response status matches any of the given codes
 * @param statusCodes - Array of HTTP status codes to check
 * @param makeError - Function to create the error from the response
 * @returns Effect handler that can be piped after HTTP calls
 */
export const failOnHttpStatuses = <TData, E>(
  statusCodes: number[],
  makeError: (resp: HttpResponse<TData>) => E
) =>
  Effect.flatMap((resp: HttpResponse<TData>) =>
    failUnless(
      (r: HttpResponse<TData>) => !statusCodes.includes(r.status),
      makeError
    )(resp)
  )
