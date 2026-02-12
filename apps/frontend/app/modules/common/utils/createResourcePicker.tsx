import type { Schema } from 'effect'
import { PromisedDataPicker } from '../components/BasePicker/BasePicker'
import { usePickerData } from '../components/BasePicker/hooks/usePickerData'
import type {
  BasePickerProps,
  PickerItem,
} from '../components/BasePicker/types/PickerTypes'
import type { Schemas } from '@assessmentis/clinical-domain'

/**
 * Configuration for creating a resource picker component
 */
export interface ResourcePickerConfig<
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
> {
  resourceType: TResource['resourceType']
  formatDisplay: (resource: TResource) => string
  formatSecondary: (resource: TResource) => string
  defaultPlaceholder: string
  defaultLabel: string
}

/**
 * Creates a resource picker component with standardized behavior
 *
 * This factory function reduces duplication across resource pickers by
 * encapsulating the common pattern of:
 * 1. Transforming resources to picker items
 * 2. Using usePickerData hook
 * 3. Spreading props to BasePicker with defaults
 *
 * @example
 * ```typescript
 * export const PatientPicker = createResourcePicker({
 *   repository: PatientRepository,
 *   formatDisplay: (p) => formatHumanName(p.name?.[0], 'Unnamed Patient'),
 *   formatSecondary: (p) => `${formatGender(p.gender)} • Born: ${formatDate(p.birthDate)}`,
 *   defaultPlaceholder: 'Select a patient...',
 *   defaultLabel: 'Patient',
 * })
 * ```
 */
export function createResourcePicker<
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
>(config: ResourcePickerConfig<TResource>) {
  const transform = (
    resource: TResource
  ): PickerItem<{ resource: TResource }> => ({
    id: resource.id!,
    displayName: config.formatDisplay(resource),
    secondaryText: config.formatSecondary(resource),
    metadata: { resource },
  })

  return function ResourcePicker(
    props: Omit<BasePickerProps<{ resource: TResource }>, 'items' | 'loading'>
  ) {
    const [itemsPromise] = usePickerData<TResource, { resource: TResource }>({
      resourceType: config.resourceType,
      transform,
    })

    return (
      <PromisedDataPicker
        {...props}
        itemsPromise={itemsPromise}
        immediate={props.immediate ?? true}
        placeholder={props.placeholder || config.defaultPlaceholder}
        label={props.label || config.defaultLabel}
      />
    )
  }
}
