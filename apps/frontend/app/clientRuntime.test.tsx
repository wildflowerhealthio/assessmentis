import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { Effect, ManagedRuntime } from 'effect'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'

// Mock firebase platform to avoid pulling opentelemetry deps in tests
vi.mock('./firebase', () => ({
  platform: {
    runtime: {
      changes: { pipe: vi.fn() },
    },
  },
}))

import { useRuntime, LoadedRuntimeContext, ContextError } from './clientRuntime'
import { LoadedResult } from '@assessmentis/ontology'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('useRuntime', () => {
  it('should return a runtime with runPromise when loading', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        LoadedRuntimeContext.Provider,
        {
          value: LoadedResult.loading<
            ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
            ContextError
          >(),
        },
        children
      )

    const { result } = renderHook(() => useRuntime(), { wrapper })

    expect(result.current).toHaveProperty('runPromise')
  })

  it('should queue effects and execute them when runtime loads', async () => {
    const mockRuntime = {
      runPromise: vi.fn().mockResolvedValue('success'),
      runFork: vi.fn(),
    } as unknown as ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [loadedRuntime, setLoadedRuntime] = React.useState(
        LoadedResult.loading<
          ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
          ContextError
        >()
      )

      React.useEffect(() => {
        const timer = setTimeout(
          () =>
            setLoadedRuntime(
              LoadedResult.loaded<
                ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
                ContextError
              >(mockRuntime)
            ),
          50
        )
        return () => clearTimeout(timer)
      }, [])

      return React.createElement(
        LoadedRuntimeContext.Provider,
        { value: loadedRuntime },
        children
      )
    }

    const { result } = renderHook(() => useRuntime(), { wrapper: Wrapper })

    // Queue an effect
    result.current.runPromise(Effect.succeed('ok'))

    // Wait for runtime to load and effect to execute
    await waitFor(() => {
      expect(mockRuntime.runPromise).toHaveBeenCalled()
    })
  })

  it('should throw when accessing runtime in error state', () => {
    const error: ContextError = { _tag: 'OrgDataError', cause: undefined }

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(
        LoadedRuntimeContext.Provider,
        {
          value: LoadedResult.error<
            ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
            ContextError
          >(error),
        },
        children
      )

    try {
      renderHook(() => useRuntime(), { wrapper: Wrapper })
      throw new Error('expected renderHook to throw')
    } catch (err) {
      expect(err).toMatchObject({ _tag: 'OrgDataError' })
    }
  })
})
