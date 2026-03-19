// oxlint-disable eslint-plugin-import/group-exports
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigate,
} from 'react-router'

import './globals.css'

import { Cause } from 'effect'
import { FiberFailureCauseId } from 'effect/Runtime'

import {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import * as firebase from '@/firebase'

import * as auth from './firebase-web-layer'
import { PlatformContextProvider } from './layers/platform-context-provider'
import { BreadcrumbProvider } from './modules/Breadcrumbs/breadcrumb-provider'
import { PageLoader } from './modules/common/components/PageLoader/page-loader'
import { shouldShowRawData } from './util/debug-helpers'

// HydrateFallback is rendered while the client loader is running
export function HydrateFallback(): React.JSX.Element {
  return <PageLoader />
}

export function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script src="https://apis.google.com/js/api.js"></script>
        <Links />
        <Meta />
      </head>
      <body>
        <BreadcrumbProvider>
          <PlatformContextProvider>
            <div
              style={{
                flexDirection: 'column',
                flexGrow: 1,
                flexShrink: 1,
                margin: '0 auto',
                marginInline: 'auto',
                overflowY: 'hidden',

                paddingBlock: 'var(--space-4)',
                paddingInline: 'var(--space-8)',
                width: '100%',
              }}
            >
              {children}
            </div>
          </PlatformContextProvider>
        </BreadcrumbProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App(): React.JSX.Element {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }): React.JSX.Element {
  const navigate = useNavigate()
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined
  let cause: Cause.Cause<unknown> | undefined
  let rootError: unknown
  let action: undefined | { label: string; onClick: () => void }

  console.error('Error Reached Boundary')
  console.error({ error })
  if (cause) {
    console.error({ cause })
  }
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404 - Not Found' : 'Unhandled Error'
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
    action = {
      label: 'Go Home',
      onClick: (): void => {
        void navigate('/')
      },
    }
  } else if (error && error instanceof Error) {
    const errorCause = FiberFailureCauseId in error ? error[FiberFailureCauseId] : undefined
    if (shouldShowRawData(error)) {
      details = error.message
      stack = error.stack
    }
    cause = Cause.isCause(errorCause) ? errorCause : undefined
    rootError = cause && 'error' in cause ? cause.error : undefined

    if (cause && Cause.isFailure(cause) && rootError) {
      if (rootError instanceof AuthError) {
        message = 'Please Reauthenticate'
        details = 'Please log back into your Google account to reconnect'
        void auth.auth.signOut()
        action = {
          label: 'Log In',
          onClick: (): void => {
            void firebase.signIn().then(() => void navigate(0))
          },
        }
      } else if (rootError instanceof NotFoundError) {
        message = '404 - Not Found'
        details = 'The requested resource could not be found.'
        action = {
          label: 'Go Back',
          onClick: (): void => {
            void navigate(-1)
          },
        }
      } else if (rootError instanceof UnhandledError) {
        message = 'Unhandled Error'
        details = `An error occurred within this application: ${rootError.message}`
        action = {
          label: 'Go Back',
          onClick: (): void => {
            void navigate(-1)
          },
        }
      } else if (rootError instanceof ExternalAssertionError) {
        message = 'External Error'
        details = `An external service isn't behaving as expected: ${rootError.message}`
        action = {
          label: 'Go Back',
          onClick: (): void => {
            void navigate(-1)
          },
        }
      }
    }
  }

  return (
    <main style={{ overflowY: 'scroll' }}>
      <h1>{message}</h1>
      <p>{details}</p>

      {action ? (
        <button
          style={{ margin: 'var(--space-2)' }}
          className="element-button button-3 filled accent-blue"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : undefined}

      {stack && (
        <pre
          style={{
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          <code>{stack}</code>
        </pre>
      )}
      <h2>Cause:</h2>
      {(rootError ?? cause) ? (
        <pre style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          <code>{JSON.stringify(rootError ?? cause, null, 2)}</code>
        </pre>
      ) : undefined}
    </main>
  )
}
