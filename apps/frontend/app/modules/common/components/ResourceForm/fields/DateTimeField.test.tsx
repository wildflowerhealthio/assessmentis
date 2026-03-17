import { describe, expect, it, vi } from 'vitest'
import { DateTime, Option } from 'effect'

import { act, render, screen } from '@testing-library/react'

import { DateTimeField } from './DateTimeField'
import type { DateTimeFieldProps } from './DateTimeField'

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

// ── DateTimeField ───────────────────────────────────────────────────────────

describe('DateTimeField', () => {
  function renderField(overrides: Partial<DateTimeFieldProps> = {}) {
    const onChange = vi.fn()
    const props: DateTimeFieldProps = {
      name: 'testDateTime',
      label: 'Test DateTime',
      value: undefined,
      onChange,
      ...overrides,
    }
    const result = render(<DateTimeField {...props} />)
    return { ...result, onChange, props }
  }

  describe('rendering', () => {
    it('renders label and required indicator', () => {
      renderField({ required: true, label: 'Appointment Time' })
      expect(screen.getByText('Appointment Time')).toBeDefined()
      expect(screen.getByText('*')).toBeDefined()
    })

    it('renders error message', () => {
      renderField({ error: 'Date is required' })
      expect(screen.getByText('Date is required')).toBeDefined()
    })

    it('renders enabled input', () => {
      renderField()
      expect(getInput().disabled).toBe(false)
    })
  })

  describe('value display', () => {
    it('displays empty string when value is undefined', () => {
      renderField({ value: undefined })
      expect(getInput().value).toBe('')
    })

    it('displays ISO-formatted value for datetime-local input', () => {
      const dateTime = makeLocalZoned('2024-06-15T14:30')
      renderField({ value: dateTime })
      expect(getInput().value).toBe('2024-06-15T14:30')
    })

    it.each(['2024-01-01T00:00', '2024-06-15T14:30', '2024-12-31T23:59'])(
      'formats %s as valid datetime-local value',
      (isoStr) => {
        renderField({ value: makeLocalZoned(isoStr) })
        expect(getInput().value).toBe(isoStr)
      }
    )
  })

  describe('onChange', () => {
    it('calls onChange with DateTime.Zoned matching the input value', () => {
      const { onChange } = renderField({ value: undefined })

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
      const { onChange } = renderField({ value: dateTime })

      act(() => {
        fireInputChange(getInput(), '')
      })

      expect(onChange).toHaveBeenCalledOnce()
      expect(onChange.mock.calls[0][0]).toBeUndefined()
    })
  })
})
