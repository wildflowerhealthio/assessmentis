import { Data } from 'effect'

export class UnhandledError extends Data.TaggedError('UnhandledError')<{
  cause: unknown
}> {
  constructor(params: { cause: unknown }) {
    super(params)
    if (this.cause instanceof Error) {
      this.message = this.cause.message ?? this.message
      this.stack = this.cause.stack ?? this.stack
      if (this.cause.name) this.name = `Unhandled${this.cause.name}`
    }
  }
}

export class ExternalAssertionError extends Data.TaggedError(
  'ExternalAssertionError'
)<{
  expected: string
  cause: unknown
}> {
  constructor(params: { cause: unknown; expected: string }) {
    super(params)
    if (this.cause instanceof Error) {
      this.message = this.cause.message ?? this.message
      this.stack = this.cause.stack ?? this.stack
      if (this.cause.name) this.name = `Unhandled${this.cause.name}`
    }
  }
}

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  resourceType: string
  params: object
  cause?: unknown
}> {}

export class NeedsAuthenticationError extends Data.TaggedError(
  'NeedsAuthenticationError'
)<{
  cause?: unknown
}> {}
