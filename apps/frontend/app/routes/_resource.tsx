import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import React from 'react'
import { Outlet } from 'react-router'
import { NotLoggedIn } from '../../../../domain/platform-domain/src/loadedValues/UserId'
import { LoginButton } from '../modules/global/components/LoginButton'
import { useLoadedRuntimeContext } from '../clientRuntime'
import { RuntimeContextOrErr } from '../modules/global/components/RuntimeContextOrErr'

interface IProps {
  loadedRuntime: ReturnType<typeof useLoadedRuntimeContext>
}

const ResourcePage = () => {
  const loadedRuntime = useLoadedRuntimeContext()
  return <InnerResourcePage loadedRuntime={loadedRuntime} />
}

export default ResourcePage

const hasTag = (error: unknown, tag: string): boolean => {
  return (
    typeof error == 'object' &&
    error !== null &&
    '_tag' in error &&
    error._tag == tag
  )
}

const asCaughtError = (error: unknown) => {
  if (error instanceof NeedsAuthenticationError) {
    return {
      type: 'NeedsAuthenticationError',
      error,
    }
  }
  if (hasTag(error, 'NotLoggedIn')) {
    return {
      type: 'NotLoggedIn',
      error,
    }
  }

  if (hasTag(error, 'OrgDataError')) {
    return {
      type: 'OrgDataError',
      error,
    }
  }

  if (hasTag(error, 'UserDataError')) {
    return {
      type: 'UserDataError',
      error,
    }
  }

  if (hasTag(error, 'AuthStateError')) {
    return {
      type: 'AuthStateError',
      error,
    }
  }

  if (error instanceof ExternalAssertionError) {
    return {
      type: 'ExternalAssertionError',
      error,
    }
  }

  if (error instanceof UnhandledError) {
    return {
      type: 'UnhandledError',
      error,
    }
  }

  return null
}

class InnerResourcePage extends React.Component<
  IProps,
  {
    error:
      | null
      | {
          type: 'NeedsAuthenticationError'
          error: NeedsAuthenticationError
        }
      | {
          type: 'NotLoggedIn'
          error: NotLoggedIn
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
          type: 'OrgDataError'
          error: unknown
        }
      | {
          type: 'UserDataError'
          error: unknown
        }
      | {
          type: 'AuthStateError'
          error: unknown
        }
  }
> {
  constructor(props: IProps) {
    super(props)
    this.state = { error: null }
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

  componentDidUpdate(_prevProps: IProps, _prevState: object) {
    if (this.state.error === null) return

    switch (this.state.error.type) {
      case 'NeedsAuthenticationError':
      case 'NotLoggedIn':
      case 'OrgDataError':
      case 'UserDataError':
      case 'AuthStateError':
        if (this.props.loadedRuntime._tag == 'loaded') {
          this.setState({ error: null })
        }
        return
    }
  }

  render() {
    if (this.state.error === null) {
      return (
        <RuntimeContextOrErr>
          <Outlet />
        </RuntimeContextOrErr>
      )
    }

    let errorContent: JSX.Element
    if (
      this.state.error &&
      ['NotLoggedIn', 'NeedsAuthenticationError', 'AuthStateError'].includes(
        this.state.error.type
      )
    ) {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>Please log in</h1>
          <p style={{ textAlign: 'center' }}>
            You need to log in to access this page.
          </p>
          <LoginButton
            style={{ display: 'block', margin: '0 auto' }}
            className="button-2"
          />
        </>
      )
    } else if (this.state.error && ['', ''].includes(this.state.error.type)) {
      errorContent = (
        <>
          <h1 style={{ textAlign: 'center' }}>
            There Was a Problem Loading Your Organization or User Data
          </h1>
          <button
            className="button-2"
            style={{ display: 'block', margin: '0 auto' }}
            onClick={() => this.setState({ error: null })}
          >
            Call for help
          </button>
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
            className="button-2"
            style={{ display: 'block', margin: '0 auto' }}
            onClick={() => this.setState({ error: null })}
          >
            Try Again
          </button>
          <button
            className="button-2"
            style={{ display: 'block', margin: '0 auto' }}
            onClick={() => window.location.reload()}
          >
            Hard Reload Page
          </button>
        </div>

        {/* Raw Data (for debugging) */}
        <details style={{ marginTop: 'var(--space-5)' }}>
          <summary className="heading-3">Details (for support)</summary>
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
