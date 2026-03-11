import { Suspense, use, type ComponentType, type FC } from 'react'

import { ErrorBoundary } from 'react-error-boundary'

/**
 * Contract for sync components that can be wrapped by `withPromisedValue`.
 *
 * Sync components must accept:
 * - `value: V` — the resolved value (or undefined while loading)
 * - `loading: boolean` — true when the promise is still pending
 * - `valueError: unknown` — the rejection reason if the promise failed
 */
interface PromiseReadyProps {
  value: unknown | undefined
  loading: boolean
  valueError: unknown
}
type PromiseReadyPropKeys = 'value' | 'loading' | 'valueError'

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value != null && typeof value === 'object' && 'then' in value
}

const mergeComplimentary = <T, K extends keyof T>(
  most: Omit<T, K>,
  rest: Pick<T, K>
): T =>
  ({
    ...most,
    ...rest,
  }) as T

/**
 * HOC that converts a sync component into a promise-aware component.
 *
 * @typeParam InnerProps - Props of the wrapped sync component; must extend
 *   {@link PromiseReadyProps} (`value`, `loading`, `valueError`)
 * @param SyncComponent - The component to wrap. Rendered in all three states:
 *   loading (`loading=true`), resolved (`value` set), and rejected (`valueError` set).
 * @returns A new component accepting the same props minus `loading`/`valueError`,
 *   with `value` widened to `V | Promise<V>`.
 *
 * @remarks
 * - **Plain values** short-circuit `<Suspense>` entirely and render directly.
 * - **Promises** are wrapped in `<ErrorBoundary>` + `<Suspense>`. The sync
 *   component itself is used as the Suspense fallback (with `loading=true`) and
 *   as the error boundary fallback (with `valueError` set) — no separate
 *   skeleton or error UI is needed.
 * - Use `startTransition` when updating the promise prop to prevent the
 *   fallback from flashing during transitions.
 */
export function withPromisedValue<InnerProps extends PromiseReadyProps>(
  SyncComponent: ComponentType<InnerProps>
): FC<
  Omit<InnerProps, PromiseReadyPropKeys> & {
    value: InnerProps['value'] | Promise<InnerProps['value']>
  }
> {
  type V = InnerProps['value']

  // Inner component that calls use() to unwrap the promise.
  // MUST be a child of the Suspense boundary so that suspension is caught.
  function Resolved({
    promise,
    rest,
  }: {
    promise: Promise<V>
    rest: Omit<InnerProps, PromiseReadyPropKeys>
  }) {
    const value = use(promise)
    const props: InnerProps = mergeComplimentary(rest, {
      value,
      loading: false,
      valueError: undefined,
    })
    return <SyncComponent {...props} />
  }

  function PromisedComponent(
    props: Omit<InnerProps, PromiseReadyPropKeys> & {
      value: V | Promise<V>
    }
  ) {
    const { value } = props
    const restProps: Omit<InnerProps, PromiseReadyPropKeys> = props

    // Short-circuit: plain values skip Suspense entirely
    if (!isPromiseLike(value)) {
      const promiseReadyProps: Pick<InnerProps, PromiseReadyPropKeys> = {
        value,
        loading: false,
        valueError: undefined,
      }
      const syncProps: InnerProps = mergeComplimentary(
        restProps,
        promiseReadyProps
      )

      return <SyncComponent {...syncProps} />
    }

    const fallbackProps: InnerProps = mergeComplimentary(restProps, {
      value: undefined,
      loading: true,
      valueError: undefined,
    })

    return (
      <ErrorBoundary
        fallbackRender={({ error }) => {
          const errorProps = mergeComplimentary(restProps, {
            value: undefined,
            loading: false,
            valueError: error,
          })
          return <SyncComponent {...errorProps} />
        }}
      >
        <Suspense fallback={<SyncComponent {...fallbackProps} />}>
          <Resolved promise={value} rest={restProps} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  PromisedComponent.displayName = `withPromisedValue(${SyncComponent.displayName || SyncComponent.name || 'Component'})`

  return PromisedComponent
}
