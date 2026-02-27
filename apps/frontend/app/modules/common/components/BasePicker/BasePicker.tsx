import { useState, useMemo, Suspense } from 'react'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { cn } from '@assessmentis/react-util'
import type { BasePickerProps, PromisedPickerProps } from './types/PickerTypes'
import { usePickerFilter } from './hooks/usePickerFilter'
import { usePickerSelection } from './hooks/usePickerSelection'
import classes from './BasePicker.module.css'
import { ErrorBoundary } from 'react-error-boundary'
import { Await } from 'react-router'

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

export function PromisedDataPicker<T>({
  itemsPromise,
  ...commonProps
}: PromisedPickerProps<T>) {
  return (
    <ErrorBoundary
      resetKeys={[itemsPromise]}
      fallbackRender={({ error }) => (
        <BasePicker {...commonProps} items={[]} error={String(error)} />
      )}
    >
      <Suspense fallback={<BasePicker {...commonProps} items={[]} loading />}>
        <Await resolve={itemsPromise}>
          {(items) => <BasePicker {...commonProps} items={items} />}
        </Await>
      </Suspense>
    </ErrorBoundary>
  )
}

export function BasePicker<T>(props: BasePickerProps<T>) {
  const {
    items,
    picking,
    loading = false,
    filterFn,
    placeholder,
    label,
    disabled,
    error,
    className,
    renderItem,
    immediate,
  } = props

  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = usePickerFilter(items, searchQuery, filterFn)
  const { selectedItems, handleSelect, handleSelectMany, isSelected } =
    usePickerSelection<T>(items, picking)

  // Create placeholder items while loading if we have a value but no matching items
  const displayItems = useMemo(() => {
    if (selectedItems.length > 0) {
      return selectedItems
    }
    // If we have a value but no selectedItems (items still loading), show placeholder
    if (picking.value && loading) {
      const ids = Array.isArray(picking.value) ? picking.value : [picking.value]
      return ids.map((id) => ({
        url: ReadonlyUrl.make({ pathname: id }),
        displayName: 'Loading...',
        metadata: undefined,
      }))
    }

    return selectedItems
  }, [selectedItems, picking.value, loading])

  return (
    <div className={cn(classes.Picker, className)}>
      {label && (
        <label className={cn('label-3', classes.Picker__label)}>{label}</label>
      )}

      <Combobox
        value={displayItems}
        onChange={(item) => {
          if (Array.isArray(item)) {
            handleSelectMany(item)
          } else if (item) {
            handleSelect(item)
          }
        }}
        multiple={props.picking.multiple}
        disabled={disabled || loading}
        immediate={immediate}
      >
        <div className={classes.Picker__container}>
          <ComboboxInput
            className={cn(
              'input-2',
              classes.Picker__input,
              error ? classes['Picker__input--error'] : '',
              disabled || loading ? classes['Picker__input--disabled'] : ''
            )}
            placeholder={placeholder || 'Search...'}
            onChange={(e) => setSearchQuery(e.target.value)}
            displayValue={(
              item:
                | undefined
                | { displayName: string }
                | { displayName: string }[]
            ) => {
              if (!item) return ''
              if (Array.isArray(item)) {
                return item.map((i) => i.displayName).join(', ')
              }
              return item.displayName || ''
            }}
          />

          <ComboboxButton className={classes.Picker__button}>
            <ChevronIcon className={classes.Picker__chevron} />
          </ComboboxButton>
        </div>

        <ComboboxOptions className={classes.Picker__options}>
          {loading ? (
            <div className={cn('body-3', classes.Picker__loading)}>
              Loading...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={cn('body-3', classes.Picker__empty)}>
              {searchQuery ? 'No results found' : 'No items available'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <ComboboxOption
                key={item.url.toString()}
                value={item}
                className={({ active }) =>
                  cn(classes.Picker__option, {
                    [classes['Picker__option--active']]: active,
                    [classes['Picker__option--selected']]: isSelected(item),
                  })
                }
              >
                {({ selected }) => (
                  <div className={classes.Picker__optionContent}>
                    {picking.multiple && (
                      <div
                        className={cn(classes.Picker__checkbox, {
                          [classes['Picker__checkbox--checked']]:
                            isSelected(item),
                        })}
                      >
                        {isSelected(item) && (
                          <CheckIcon className={classes.Picker__checkIcon} />
                        )}
                      </div>
                    )}
                    {renderItem ? (
                      renderItem(item)
                    ) : (
                      <div className={classes.Picker__itemContent}>
                        <div className="body-3">{item.displayName}</div>
                        {item.secondaryText && (
                          <div
                            className={cn('body-3', classes.Picker__secondary)}
                          >
                            {item.secondaryText}
                          </div>
                        )}
                      </div>
                    )}
                    {!picking.multiple && selected && (
                      <CheckIcon className={classes.Picker__selectedIcon} />
                    )}
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>

      {error && (
        <div className={cn('body-3', classes.Picker__error)}>{error}</div>
      )}
    </div>
  )
}
