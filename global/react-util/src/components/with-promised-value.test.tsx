import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { act, render, screen } from '@testing-library/react'

import { withPromisedValue } from './with-promised-value'

// ── Minimal sync component for testing ──────────────────────────────────────

interface TestSyncProps {
  value: string | undefined
  loading: boolean
  valueError: unknown
  label: string
}

function TestSync({ value, loading, valueError, label }: TestSyncProps) {
  let errorString: string
  if (valueError === null || valueError === undefined) {
    errorString = 'none'
  } else if (valueError instanceof Error) {
    errorString = `Error: ${valueError.message}`
  } else {
    // oxlint-disable-next-line typescript/no-base-to-string
    errorString = String(valueError)
  }
  return (
    <div data-testid="component">
      <span data-testid="label">{label}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="value">{value ?? 'none'}</span>
      <span data-testid="error">{errorString}</span>
    </div>
  )
}

const TestPromised = withPromisedValue<TestSyncProps>(TestSync)

// ── Tests ───────────────────────────────────────────────────────────────────

describe('withPromisedValue', () => {
  describe('plain (non-promise) values', () => {
    it('renders directly with loading=false for a plain value', () => {
      render(<TestPromised value="hello" label="test" />)
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('value').textContent).toBe('hello')
      expect(screen.getByTestId('error').textContent).toBe('none')
    })

    it('renders directly with loading=false for undefined', () => {
      render(<TestPromised value={undefined} label="test" />)
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('value').textContent).toBe('none')
      expect(screen.getByTestId('error').textContent).toBe('none')
    })
  })

  describe('promise values', () => {
    it('renders with loading=true while promise is pending', () => {
      render(<TestPromised value={new Promise<string>(() => {})} label="test" />)
      expect(screen.getByTestId('loading').textContent).toBe('true')
      expect(screen.getByTestId('value').textContent).toBe('none')
    })

    it('renders resolved value with loading=false', async () => {
      await act(async () => {
        render(<TestPromised value={Promise.resolve('hello')} label="test" />)
      })
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('value').textContent).toBe('hello')
      expect(screen.getByTestId('error').textContent).toBe('none')
    })

    it('renders resolved undefined with loading=false', async () => {
      await act(async () => {
        render(<TestPromised value={Promise.resolve(undefined)} label="test" />)
      })
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('value').textContent).toBe('none')
    })
  })

  describe('error handling', () => {
    it('passes valueError when promise rejects', async () => {
      const p = Promise.reject(new Error('test error'))
      // Prevent unhandled rejection warning
      p.catch(() => {})
      await act(async () => {
        render(<TestPromised value={p} label="test" />)
      })
      expect(screen.getByTestId('error').textContent).toBe('Error: test error')
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('value').textContent).toBe('none')
    })
  })

  describe('prop passthrough', () => {
    it('passes non-value/loading/valueError props unchanged', async () => {
      await act(async () => {
        render(<TestPromised value={Promise.resolve('val')} label="my-label" />)
      })
      expect(screen.getByTestId('value').textContent).toBe('val')
      expect(screen.getByTestId('label').textContent).toBe('my-label')
    })
  })

  describe('property: resolves to correct value for any string input', () => {
    it('always resolves correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (value) => {
          const { unmount } = await act(() =>
            render(<TestPromised value={Promise.resolve(value)} label="test" />)
          )
          expect(screen.getByTestId('loading').textContent).toBe('false')
          expect(screen.getByTestId('value').textContent).toBe(value ?? 'none')
          unmount()
        }),
        { numRuns: 20 }
      )
    })
  })
})
