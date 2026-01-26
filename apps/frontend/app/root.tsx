import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from 'react-router'
import './globals.css'
import { FiberFailureCauseId } from 'effect/Runtime'
import { Cause } from 'effect'
import {
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
  AuthError,
} from '@assessmentis/ontology'
import * as firebase from 'app/firebase'
import * as auth from './FirebaseWebLayer'
import { BreadcrumbProvider } from './modules/global/components/BreadcrumbProvider/BreadcrumbProvider'
import { shouldShowRawData } from './util/debugHelpers'
import { PageLoader } from './modules/common/components/PageLoader/PageLoader'
import { PlatformContextProvider } from './layers/PlatformContextProvider'
// HydrateFallback is rendered while the client loader is running
export function HydrateFallback() {
  return <PageLoader />
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
        <script src="https://apis.google.com/js/api.js"></script>
        <Links />
        <Meta />
      </head>
      <body>
        <BreadcrumbProvider>
          <PlatformContextProvider>
            <div
              style={{
                width: '100%',
                margin: '0 auto',
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: 'column',
                overflowY: 'hidden',

                paddingBlock: 'var(--space-4)',
                paddingInline: 'var(--space-8)',
                marginInline: 'auto',
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

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const navigate = useNavigate()
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined
  let cause: Cause.Cause<unknown> | undefined
  let rootError: unknown | undefined
  let action: undefined | { label: string; onClick: () => void }

  console.error('Error Reached Boundary')
  console.error({ error })
  if (cause) {
    console.error({ cause })
  }
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404 - Not Found' : 'Unhandled Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
    action = { label: 'Go Home', onClick: () => navigate('/') }
  } else if (error && error instanceof Error) {
    const errorCause =
      FiberFailureCauseId in error ? error[FiberFailureCauseId] : undefined
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
        auth.auth.signOut()
        action = {
          label: 'Log In',
          onClick: () => firebase.signIn().then(() => navigate(0)),
        }
      } else if (rootError instanceof NotFoundError) {
        message = '404 - Not Found'
        details = 'The requested resource could not be found.'
        action = { label: 'Go Back', onClick: () => navigate(-1) }
      } else if (rootError instanceof UnhandledError) {
        message = 'Unhandled Error'
        details = `An error occurred within this application: ${rootError.message}`
        action = { label: 'Go Back', onClick: () => navigate(-1) }
      } else if (rootError instanceof ExternalAssertionError) {
        message = 'External Error'
        details = `An external service isn't behaving as expected: ${rootError.message}`
        action = { label: 'Go Back', onClick: () => navigate(-1) }
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
