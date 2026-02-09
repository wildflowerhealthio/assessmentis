import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DateTime, Option } from 'effect'
import {
  DateTimeFieldSync,
  DateTimeFieldSyncProps,
  DateTimeField,
} from './DateTimeField'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLocalZoned(isoWithoutTZ: string): DateTime.Zoned {
  return DateTime.makeZoned(`${isoWithoutTZ}:00`, {
    adjustForTimeZone: true,
    timeZone: DateTime.zoneMakeLocal(),
  }).pipe(Option.getOrThrow)
}

function getInput(name = 'testDateTime'): HTMLInputElement {
  return document.querySelector(`input[name="${name}"]`) as HTMLInputElement
}

function fireInputChange(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set?.call(input, value)
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

// ── DateTimeFieldSync (pure sync component) ─────────────────────────────────

describe('DateTimeFieldSync', () => {
  function renderSync(overrides: Partial<DateTimeFieldSyncProps> = {}) {
    const onChange = vi.fn()
    const props: DateTimeFieldSyncProps = {
      name: 'testDateTime',
      label: 'Test DateTime',
      value: undefined,
      loading: false,
      valueError: undefined,
      onChange,
      ...overrides,
    }
    const result = render(<DateTimeFieldSync {...props} />)
    return { ...result, onChange, props }
  }

  describe('rendering', () => {
    it('renders label and required indicator', () => {
      renderSync({ required: true, label: 'Appointment Time' })
      expect(screen.getByText('Appointment Time')).toBeDefined()
      expect(screen.getByText('*')).toBeDefined()
    })

    it('renders error message', () => {
      renderSync({ error: 'Date is required' })
      expect(screen.getByText('Date is required')).toBeDefined()
    })

    it('is enabled when loading=false and no valueError', () => {
      renderSync({ loading: false, valueError: undefined })
      expect(getInput().disabled).toBe(false)
    })

    it('is disabled when loading=true', () => {
      renderSync({ loading: true })
      expect(getInput().disabled).toBe(true)
    })

    it('is disabled when valueError is set', () => {
      renderSync({ valueError: new Error('fail') })
      expect(getInput().disabled).toBe(true)
    })
  })

  describe('value display', () => {
    it('displays empty string when value is undefined', () => {
      renderSync({ value: undefined })
      expect(getInput().value).toBe('')
    })

    it('displays ISO-formatted value for datetime-local input', () => {
      const dateTime = makeLocalZoned('2024-06-15T14:30')
      renderSync({ value: dateTime })
      expect(getInput().value).toBe('2024-06-15T14:30')
    })

    it.each(['2024-01-01T00:00', '2024-06-15T14:30', '2024-12-31T23:59'])(
      'formats %s as valid datetime-local value',
      (isoStr) => {
        renderSync({ value: makeLocalZoned(isoStr) })
        expect(getInput().value).toBe(isoStr)
      }
    )
  })

  describe('onChange', () => {
    it('calls onChange with DateTime.Zoned matching the input value', () => {
      const { onChange } = renderSync({ value: undefined })

      act(() => {
        fireInputChange(getInput(), '2024-06-15T14:30')
      })

      expect(onChange).toHaveBeenCalledOnce()
      const result = onChange.mock.calls[0][0] as DateTime.Zoned
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.toEpochMillis(result)).toBe(
        DateTime.toEpochMillis(makeLocalZoned('2024-06-15T14:30'))
      )
    })

    it('calls onChange with undefined when cleared', () => {
      const dateTime = makeLocalZoned('2024-06-15T14:30')
      const { onChange } = renderSync({ value: dateTime })

      act(() => {
        fireInputChange(getInput(), '')
      })

      expect(onChange).toHaveBeenCalledOnce()
      expect(onChange.mock.calls[0][0]).toBeUndefined()
    })
  })
})

// ── DateTimeField (promised wrapper via withPromisedValue) ──────────────────

describe('DateTimeField', () => {
  it('is disabled while promise is pending', () => {
    render(
      <DateTimeField
        name="testDateTime"
        label="Test"
        value={new Promise(() => {})}
        onChange={() => {}}
      />
    )
    expect(getInput().disabled).toBe(true)
  })

  it('is enabled after promise resolves', async () => {
    await act(async () => {
      render(
        <DateTimeField
          name="testDateTime"
          label="Test"
          value={Promise.resolve(undefined)}
          onChange={() => {}}
        />
      )
    })
    expect(getInput().disabled).toBe(false)
  })

  it('displays resolved value', async () => {
    const dateTime = makeLocalZoned('2024-06-15T14:30')
    await act(async () => {
      render(
        <DateTimeField
          name="testDateTime"
          label="Test"
          value={Promise.resolve(dateTime)}
          onChange={() => {}}
        />
      )
    })
    expect(getInput().disabled).toBe(false)
    expect(getInput().value).toBe('2024-06-15T14:30')
  })

  it('is disabled when promise rejects', async () => {
    const p = Promise.reject(new Error('fail'))
    p.catch(() => {})
    await act(async () => {
      render(
        <DateTimeField
          name="testDateTime"
          label="Test"
          value={p}
          onChange={() => {}}
        />
      )
    })
    expect(getInput().disabled).toBe(true)
    expect(getInput().value).toBe('')
  })

  it('works with plain (non-promise) values', () => {
    render(
      <DateTimeField
        name="testDateTime"
        label="Test"
        value={makeLocalZoned('2024-06-15T14:30')}
        onChange={() => {}}
      />
    )
    expect(getInput().disabled).toBe(false)
    expect(getInput().value).toBe('2024-06-15T14:30')
  })
})
