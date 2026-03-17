import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'

import { usePickerSelection } from './usePickerSelection'
import type { MultiPickerProps, SinglePickerProps } from './usePickerSelection'

// --- Helpers ---------------------------------------------------------------

/** Creates a minimal PickerItemInstance with the given id, display, and secondary. */
function makeItem(
  id: string,
  display = `Display ${id}`,
  secondary = `Secondary ${id}`
): PickerItemInstance {
  return {
    PickerItem: { id, display, secondary },
  }
}

// --- Multi-select tests ----------------------------------------------------

describe('usePickerSelection', () => {
  describe('multi-select', () => {
    function renderMultiSelect(
      items: ReadonlyArray<PickerItemInstance>,
      initial: ReadonlyArray<string> | undefined = undefined
    ) {
      const onChange =
        vi.fn<(value: ReadonlyArray<string> | undefined) => void>()
      const props: MultiPickerProps = {
        multiple: true,
        value: initial,
        onChange,
      }
      const hook = renderHook(() => usePickerSelection(items, props))
      return { hook, onChange }
    }

    it('selects an item by adding its id to the value array', () => {
      const items = [makeItem('a'), makeItem('b')]
      const { hook, onChange } = renderMultiSelect(items, [])

      act(() => {
        hook.result.current.handleSelect(items[0]!)
      })

      expect(onChange).toHaveBeenCalledWith(['a'])
    })

    it('deselects an already-selected item by removing its id', () => {
      const items = [makeItem('a'), makeItem('b')]
      const { hook, onChange } = renderMultiSelect(items, ['a', 'b'])

      act(() => {
        hook.result.current.handleSelect(items[0]!)
      })

      expect(onChange).toHaveBeenCalledWith(['b'])
    })

    it('reports isSelected correctly', () => {
      const items = [makeItem('a'), makeItem('b')]
      const { hook } = renderMultiSelect(items, ['a'])

      expect(hook.result.current.isSelected(items[0]!)).toBe(true)
      expect(hook.result.current.isSelected(items[1]!)).toBe(false)
    })

    it('returns selectedItems matching the current value', () => {
      const items = [makeItem('a'), makeItem('b'), makeItem('c')]
      const { hook } = renderMultiSelect(items, ['a', 'c'])

      expect(hook.result.current.selectedItems).toEqual([items[0], items[2]])
    })
  })

  // --- Single-select tests -------------------------------------------------

  describe('single-select', () => {
    function renderSingleSelect(
      items: ReadonlyArray<PickerItemInstance>,
      initial: string | undefined = undefined
    ) {
      const onChange = vi.fn<(value: string | undefined) => void>()
      const props: SinglePickerProps = {
        multiple: false,
        value: initial,
        onChange,
      }
      const hook = renderHook(() => usePickerSelection(items, props))
      return { hook, onChange }
    }

    it('selects an item by calling onChange with its id', () => {
      const items = [makeItem('x'), makeItem('y')]
      const { hook, onChange } = renderSingleSelect(items)

      act(() => {
        hook.result.current.handleSelect(items[1]!)
      })

      expect(onChange).toHaveBeenCalledWith('y')
    })

    it('deselects the currently selected item by calling onChange with undefined', () => {
      const items = [makeItem('x')]
      const { hook, onChange } = renderSingleSelect(items, 'x')

      act(() => {
        hook.result.current.handleSelect(items[0]!)
      })

      expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('reports isSelected correctly', () => {
      const items = [makeItem('x'), makeItem('y')]
      const { hook } = renderSingleSelect(items, 'x')

      expect(hook.result.current.isSelected(items[0]!)).toBe(true)
      expect(hook.result.current.isSelected(items[1]!)).toBe(false)
    })

    it('returns selectedItems matching the current value', () => {
      const items = [makeItem('x'), makeItem('y')]
      const { hook } = renderSingleSelect(items, 'y')

      expect(hook.result.current.selectedItems).toEqual([items[1]])
    })
  })

  // --- handleSelectMany ----------------------------------------------------

  describe('handleSelectMany', () => {
    it('replaces the value with all provided item ids in multi-select mode', () => {
      const items = [makeItem('a'), makeItem('b'), makeItem('c')]
      const onChange =
        vi.fn<(value: ReadonlyArray<string> | undefined) => void>()
      const props: MultiPickerProps = {
        multiple: true,
        value: ['a'],
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      act(() => {
        result.current.handleSelectMany([items[1]!, items[2]!])
      })

      expect(onChange).toHaveBeenCalledWith(['b', 'c'])
    })

    it('does not call onChange in single-select mode', () => {
      const items = [makeItem('a'), makeItem('b')]
      const onChange = vi.fn<(value: string | undefined) => void>()
      const props: SinglePickerProps = {
        multiple: false,
        value: 'a',
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      act(() => {
        result.current.handleSelectMany([items[0]!, items[1]!])
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // --- id toString normalization -------------------------------------------

  describe('id normalization via toString()', () => {
    it('matches items whose id requires toString() coercion for includes checks', () => {
      // Simulate an id that is technically a string but ensures .toString()
      // is consistently applied in all code paths.
      const item = makeItem('42')
      const onChange =
        vi.fn<(value: ReadonlyArray<string> | undefined) => void>()
      const props: MultiPickerProps = {
        multiple: true,
        value: ['42'],
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection([item], props))

      // isSelected should find the match
      expect(result.current.isSelected(item)).toBe(true)

      // Deselecting should remove it via normalized comparison
      act(() => {
        result.current.handleSelect(item)
      })
      expect(onChange).toHaveBeenCalledWith([])
    })

    it('normalizes id in handleSelectMany output', () => {
      const items = [makeItem('1'), makeItem('2')]
      const onChange =
        vi.fn<(value: ReadonlyArray<string> | undefined) => void>()
      const props: MultiPickerProps = {
        multiple: true,
        value: undefined,
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      act(() => {
        result.current.handleSelectMany(items)
      })

      expect(onChange).toHaveBeenCalledWith(['1', '2'])
    })

    it('normalizes id in single-select onChange output', () => {
      const items = [makeItem('99')]
      const onChange = vi.fn<(value: string | undefined) => void>()
      const props: SinglePickerProps = {
        multiple: false,
        value: undefined,
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      act(() => {
        result.current.handleSelect(items[0]!)
      })

      expect(onChange).toHaveBeenCalledWith('99')
    })
  })

  // --- Edge cases ----------------------------------------------------------

  describe('edge cases', () => {
    it('handles undefined value in multi-select mode', () => {
      const items = [makeItem('a')]
      const onChange =
        vi.fn<(value: ReadonlyArray<string> | undefined) => void>()
      const props: MultiPickerProps = {
        multiple: true,
        value: undefined,
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      expect(result.current.selectedItems).toEqual([])
      expect(result.current.isSelected(items[0]!)).toBe(false)
    })

    it('handles undefined value in single-select mode', () => {
      const items = [makeItem('a')]
      const onChange = vi.fn<(value: string | undefined) => void>()
      const props: SinglePickerProps = {
        multiple: false,
        value: undefined,
        onChange,
      }
      const { result } = renderHook(() => usePickerSelection(items, props))

      expect(result.current.selectedItems).toEqual([])
      expect(result.current.isSelected(items[0]!)).toBe(false)
    })
  })
})
