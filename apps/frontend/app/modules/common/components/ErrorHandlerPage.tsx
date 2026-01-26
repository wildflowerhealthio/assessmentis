import {
  BadDataError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import React, { JSX, PropsWithChildren } from 'react'
import { useAsyncError } from 'react-router'
import { AuthError } from '@assessmentis/ontology'
import { LoginButton } from '../../global/components/LoginButton'
import { Generic404Content } from './Generic404Content'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'

interface IProps {
  error: unknown
}

export const ErrorHandlerPage = ({ children }: PropsWithChildren<object>) => {
  const error = useAsyncError()
  return <InnerErrorHandlerPage error={error}>{children}</InnerErrorHandlerPage>
}

const asCaughtError = (error: unknown) => {
  if (error instanceof AuthError) {
    return {
      type: 'AuthError',
      error,
    } as const
  }

  if (error instanceof ExternalAssertionError) {
    return {
      type: 'ExternalAssertionError',
      error,
    } as const
  }

  if (error instanceof UnhandledError) {
    return {
      type: 'UnhandledError',
      error,
    } as const
  }

  if (error instanceof BadDataError) {
    return {
      type: 'BadDataError',
      error,
    } as const
  }

  if (error instanceof NotFoundError) {
    return {
      type: 'NotFoundError',
      error,
    } as const
  }

  if (error instanceof NoSelectedOrgError) {
    return {
      type: 'NoSelectedOrgError',
      error,
    } as const
  }

  return null
}

export class InnerErrorHandlerPage extends React.Component<
  PropsWithChildren<IProps>,
  {
    error:
      | null
      | {
          type: 'AuthError'
          error: AuthError
        }
      | {
          type: 'ExternalAssertionError'
          error: ExternalAssertionError
        }
      | {
          type: 'UnhandledError'
          error: UnhandledError
        }
      | {
          type: 'NotFoundError'
          error: NotFoundError<string, Record<string, unknown>>
        }
      | {
          type: 'BadDataError'
          error: BadDataError
        }
      | {
          type: 'NoSelectedOrgError'
          error: NoSelectedOrgError
        }
  }
> {
  constructor(props: IProps) {
    super(props)
    if (props.error) {
      this.state = { error: asCaughtError(props.error) }
    } else {
      this.state = { error: null }
    }
  }

  static getDerivedStateFromError(error: unknown) {
    return { error: asCaughtError(error) }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    if (asCaughtError(error) != null) {
      console.error('ResourceErrorBoundary caught: ', {
        error,
        // Example "componentStack":
        //   in ComponentThatThrows (created by App)
        //   in ErrorBoundary (created by App)
        //   in div (created by App)
        //   in App
        componentStack: info.componentStack,
        // Warning: `captureOwnerStack` is not available in production.
        ownerStack: React.captureOwnerStack(),
      })
    } else {
      throw error
    }
  }

  render() {
    if (this.state.error === null) {
      return this.props.children
    } else if (this.state.error?.type == 'NoSelectedOrgError') {
      return this.props.children
    }

    let errorContent: JSX.Element
    if (this.state.error && 'AuthError' == this.state.error.type) {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>Please log in</h1>
          <p style={{ textAlign: 'center' }}>
            You need to log in to access this page.
          </p>
          <LoginButton
            style={{ display: 'block', margin: '0 auto' }}
            className="element-button button-2"
          />
        </>
      )
    } else if (this.state.error?.type == 'ExternalAssertionError') {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>
            An External Service Did Something Unexpected
          </h1>
          {this.renderCatchall()}
        </>
      )
    } else if (this.state.error?.type == 'UnhandledError') {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>
            Something We Don't Explicitly Handle Happened
          </h1>
          {this.renderCatchall()}
        </>
      )
    } else if (this.state.error?.type == 'NotFoundError') {
      errorContent = (
        <Generic404Content resourceType={this.state.error.error.resourceType} />
      )
    } else {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>
            Something Very Unexpected Happened
          </h1>
          {this.renderCatchall()}
        </>
      )
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
        }}
      >
        {errorContent}
      </div>
    )
  }

  renderCatchall() {
    return (
      <>
        <p style={{ textAlign: 'center' }}>Just try again?</p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            flexDirection: 'row',
          }}
        >
          <button
            className="element-button button-2"
            style={{ display: 'block', margin: '0 auto' }}
            onClick={() => this.setState({ error: null })}
          >
            Try Again
          </button>
          <button
            className="element-button button-2"
            style={{ display: 'block', margin: '0 auto' }}
            onClick={() => window.location.reload()}
          >
            Hard Reload Page
          </button>
        </div>

        {/* Raw Data (for debugging) */}
        <details style={{ marginTop: 'var(--space-5)' }}>
          <summary className="heading-4">Details (for support)</summary>
          <pre
            style={{
              background: 'var(--color-background-secondary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-2)',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(this.state.error, null, 2)}
          </pre>
        </details>
      </>
    )
  }
}
